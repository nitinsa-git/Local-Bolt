import asyncio
import ctypes
import json
import logging
import os
import re
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger("local_dev_studio.agent.local_llm_manager")

HIGHER_LLM_PRIORITY_PATTERNS: tuple[str, ...] = (
    "qwen2.5-coder:32b",
    "qwen2.5-coder-32b",
    "qwq:32b",
    "deepseek-r1:32b",
    "qwen2.5-coder:14b",
    "qwen2.5-coder-14b",
    "deepseek-r1:14b",
    "deepseek-r1:8b",
    "deepseek-r1:7b",
    "qwen2.5-coder:7b",
    "qwen2.5-coder-7b",
    "qwen2.5-coder:3b",
    "qwen2.5-coder-3b",
    "qwen3.5:2b",
    "qwen2.5-coder",
    "deepseek-r1",
    "qwen",
)


class LocalLLMManager:
    """
    CuriousLLM-Powered Local LLM Server Manager:
    - Manages the embedded Local LLM server (`llama-server.exe` on :8780) and external local LLM
      daemons (`Ollama` on :11434, `LM Studio` on :1234).
    - Implements CuriousLLM Higher-LLM Server Scaling: profiles host RAM/Swap, enables Quantized
      KV-Caches (`q8_0` / `q4_0`), Flash Attention (`-fa`), and Memory-Mapped Weight Streaming (`--mmap`)
      so higher-parameter models (`14B`, `32B`, `DeepSeek-R1`, `QwQ`, `7B`) run reliably on local hardware.
    """

    THINK_BLOCK_RE = re.compile(r"<think>(.*?)</think>", re.DOTALL | re.IGNORECASE)

    def __init__(self, backend_root: Optional[Path] = None) -> None:
        self.backend_root = backend_root or Path(__file__).resolve().parents[2]
        self.runtime_dir = self.backend_root / "llm_runtime"
        self.llama_server_bin = self.runtime_dir / "bin" / "llama-server.exe"
        self.models_dir = self.runtime_dir / "models"
        self.default_port = int(os.environ.get("LOCAL_LLM_PORT", "8780"))
        self.default_host = f"http://127.0.0.1:{self.default_port}"
        self._proc: Optional[subprocess.Popen] = None
        self._starting_lock = asyncio.Lock()
        self._preferred_model_name: Optional[str] = os.environ.get("LOCAL_LLM_MODEL")
        self._last_reasoning_trace: str = ""

    def _probe_system_resources(self) -> Dict[str, Any]:
        """
        Probes physical RAM, available RAM, and swap capacity across Windows and Linux
        to compute optimal CuriousLLM Higher-LLM server parameters (KV-cache quantization,
        context window, batch sizes, and maximum feasible model tier).
        """
        total_ram_gb = 8.0
        avail_ram_gb = 4.0
        swap_total_gb = 0.0

        try:
            if os.name == "nt":
                class MEMORYSTATUSEX(ctypes.Structure):
                    _fields_ = [
                        ("dwLength", ctypes.c_ulong),
                        ("dwMemoryLoad", ctypes.c_ulong),
                        ("ullTotalPhys", ctypes.c_ulonglong),
                        ("ullAvailPhys", ctypes.c_ulonglong),
                        ("ullTotalPageFile", ctypes.c_ulonglong),
                        ("ullAvailPageFile", ctypes.c_ulonglong),
                        ("ullTotalVirtual", ctypes.c_ulonglong),
                        ("ullAvailVirtual", ctypes.c_ulonglong),
                        ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
                    ]

                stat = MEMORYSTATUSEX()
                stat.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
                if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(stat)):
                    total_ram_gb = round(stat.ullTotalPhys / (1024**3), 2)
                    avail_ram_gb = round(stat.ullAvailPhys / (1024**3), 2)
                    page_total_gb = round(stat.ullTotalPageFile / (1024**3), 2)
                    swap_total_gb = round(max(0.0, page_total_gb - total_ram_gb), 2)
            elif Path("/proc/meminfo").exists():
                meminfo = Path("/proc/meminfo").read_text(encoding="utf-8", errors="ignore")
                kv: Dict[str, int] = {}
                for line in meminfo.splitlines():
                    parts = line.split(":")
                    if len(parts) == 2:
                        num = re.findall(r"\d+", parts[1])
                        if num:
                            kv[parts[0].strip()] = int(num[0])
                if "MemTotal" in kv:
                    total_ram_gb = round(kv["MemTotal"] / (1024 * 1024), 2)
                if "MemAvailable" in kv:
                    avail_ram_gb = round(kv["MemAvailable"] / (1024 * 1024), 2)
                if "SwapTotal" in kv:
                    swap_total_gb = round(kv["SwapTotal"] / (1024 * 1024), 2)
        except Exception:
            pass

        effective_mem_gb = round(total_ram_gb + (swap_total_gb * 0.65), 2)
        if effective_mem_gb >= 22.0:
            max_tier = "32B (Q4_K_M / IQ4_XS)"
            default_ctx = 12288
        elif effective_mem_gb >= 11.5:
            max_tier = "14B (Q4_K_M) / 7B-8B (Q8_0)"
            default_ctx = 8192
        elif effective_mem_gb >= 7.5:
            max_tier = "7B-8B (Q4_K_M) / 14B (IQ3_M + Swap)"
            default_ctx = 8192
        else:
            max_tier = "3B-7B (Q4_K_M)"
            default_ctx = 6144

        kv_quant = os.environ.get(
            "LOCAL_LLM_KV_QUANT",
            "q8_0" if total_ram_gb >= 12.0 else "q4_0",
        )
        ctx_size = int(os.environ.get("LOCAL_LLM_CTX_SIZE", str(default_ctx)))

        return {
            "enabled": True,
            "engine": "CuriousLLM Base Server Engine v1.0",
            "reasoning_mode": "curiosity-multi-hop",
            "total_ram_gb": total_ram_gb,
            "avail_ram_gb": avail_ram_gb,
            "swap_total_gb": swap_total_gb,
            "effective_memory_gb": effective_mem_gb,
            "max_feasible_tier": max_tier,
            "kv_cache_quant": kv_quant,
            "flash_attention": True,
            "mmap_streaming": True,
            "ctx_size": ctx_size,
        }

    def strip_reasoning_trace(self, text: str) -> str:
        """
        Extracts `<think>...</think>` blocks emitted by reasoning models (DeepSeek-R1, QwQ, Qwen3),
        stores the latest trace for server diagnostics, and returns the clean executable output.
        """
        if not text:
            return text
        matches = self.THINK_BLOCK_RE.findall(text)
        if matches:
            self._last_reasoning_trace = "\n".join(m.strip() for m in matches if m.strip())[:2000]
            logger.info(
                json.dumps(
                    {
                        "event": "curious_llm_reasoning_trace_captured",
                        "trace_chars": len(self._last_reasoning_trace),
                    }
                )
            )
            cleaned = self.THINK_BLOCK_RE.sub("", text).strip()
            return cleaned if cleaned else text
        return text

    def list_local_gguf_models(self) -> List[Path]:
        if not self.models_dir.exists():
            return []
        # Filter out incomplete downloads (< 500 MB) and sort largest/strongest first (7B > 3B > 1.5B)
        ggufs = [
            p
            for p in self.models_dir.glob("*.gguf")
            if p.is_file() and p.stat().st_size > 500 * 1024 * 1024
        ]
        return sorted(ggufs, key=lambda p: p.stat().st_size, reverse=True)

    def find_local_gguf_model(self) -> Optional[Path]:
        ggufs = self.list_local_gguf_models()
        if not ggufs:
            return None
        if self._preferred_model_name:
            for p in ggufs:
                if self._preferred_model_name.lower() in p.name.lower():
                    return p
        return ggufs[0]

    async def is_endpoint_alive(self, base_url: str, timeout: float = 1.8) -> Optional[Dict[str, Any]]:
        url = base_url.rstrip("/")
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                r = await client.get(f"{url}/v1/models")
                if r.status_code == 200:
                    data = r.json().get("data", [])
                    all_ids = [
                        Path(item.get("id", "default")).name
                        if ("\\" in item.get("id", "") or "/" in item.get("id", ""))
                        else item.get("id", "default")
                        for item in data
                        if item.get("id")
                    ]
                    preferred = all_ids[0] if all_ids else "default"
                    if self._preferred_model_name:
                        custom_match = next(
                            (m for m in all_ids if self._preferred_model_name.lower() in m.lower()),
                            None,
                        )
                        if custom_match:
                            preferred = custom_match
                        else:
                            for pattern in HIGHER_LLM_PRIORITY_PATTERNS:
                                match = next((m for m in all_ids if pattern in m.lower()), None)
                                if match:
                                    preferred = match
                                    break
                    else:
                        for pattern in HIGHER_LLM_PRIORITY_PATTERNS:
                            match = next((m for m in all_ids if pattern in m.lower()), None)
                            if match:
                                preferred = match
                                break
                    return {
                        "url": url,
                        "type": "openai_compat",
                        "model": preferred,
                        "raw_model": preferred,
                        "all_models": all_ids,
                    }

                r_tags = await client.get(f"{url}/api/tags")
                if r_tags.status_code == 200:
                    models = [m.get("name", "") for m in r_tags.json().get("models", []) if m.get("name")]
                    if models:
                        preferred = models[0]
                        if self._preferred_model_name:
                            custom_match = next(
                                (m for m in models if self._preferred_model_name.lower() in m.lower()),
                                None,
                            )
                            if custom_match:
                                preferred = custom_match
                            else:
                                for pattern in HIGHER_LLM_PRIORITY_PATTERNS:
                                    match = next((m for m in models if pattern in m.lower()), None)
                                    if match:
                                        preferred = match
                                        break
                        else:
                            for pattern in HIGHER_LLM_PRIORITY_PATTERNS:
                                match = next((m for m in models if pattern in m.lower()), None)
                                if match:
                                    preferred = match
                                    break
                        return {
                            "url": url,
                            "type": "ollama",
                            "model": preferred,
                            "raw_model": preferred,
                            "all_models": models,
                        }
        except Exception:
            pass
        return None

    def _kill_existing_llama_server(self) -> None:
        if self._proc and self._proc.poll() is None:
            try:
                self._proc.terminate()
                self._proc.wait(timeout=4)
            except Exception:
                pass
        self._proc = None
        if os.name == "nt":
            try:
                subprocess.run(
                    ["taskkill", "/F", "/IM", "llama-server.exe"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=5,
                )
            except Exception:
                pass

    async def ensure_local_llm_server(self) -> Optional[Dict[str, Any]]:
        """
        Probes configured local LLM servers (`:8780`, `:11434`, `:1234`).
        Applies CuriousLLM Higher-LLM Server Scaling (Quantized KV-cache `-ctk`/`-ctv`,
        Flash Attention `-fa`, and `--mmap` layer streaming) so higher-parameter models
        (`14B`, `32B`, `DeepSeek-R1`, `QwQ`, `7B`) run reliably on local hardware.
        """
        target_model_path = self.find_local_gguf_model()
        res_profile = self._probe_system_resources()

        # Check if our default host (:8780) is alive and whether it needs upgrading to a stronger GGUF
        default_info = await self.is_endpoint_alive(self.default_host)
        if default_info and target_model_path:
            active_model_name = default_info.get("model", "").lower()
            if active_model_name != target_model_path.name.lower():
                logger.info(
                    json.dumps(
                        {
                            "event": "upgrading_active_llama_server_model",
                            "from": active_model_name,
                            "to": target_model_path.name,
                        }
                    )
                )
                self._kill_existing_llama_server()
                await asyncio.sleep(0.8)
            else:
                return default_info
        elif default_info:
            return default_info

        # Check external endpoints (Ollama :11434, LM Studio :1234, custom LOCAL_LLM_URL)
        candidates = [
            os.environ.get("LOCAL_LLM_URL", ""),
            os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434"),
            "http://127.0.0.1:1234",
        ]
        seen = {self.default_host}
        for cand in candidates:
            cand = cand.strip().rstrip("/")
            if not cand or cand in seen:
                continue
            seen.add(cand)
            info = await self.is_endpoint_alive(cand)
            if info:
                return info

        async with self._starting_lock:
            info = await self.is_endpoint_alive(self.default_host)
            if info and (not target_model_path or info.get("model", "").lower() == target_model_path.name.lower()):
                return info

            model_path = self.find_local_gguf_model()
            if not self.llama_server_bin.exists() or not model_path:
                logger.warning(
                    json.dumps(
                        {
                            "event": "bundled_local_llm_missing",
                            "bin": str(self.llama_server_bin),
                            "model": str(model_path),
                        }
                    )
                )
                return None

            threads = max(4, min(8, (os.cpu_count() or 8) - 2))
            ctx_size = str(res_profile.get("ctx_size", 8192))
            kv_quant = str(res_profile.get("kv_cache_quant", "q8_0"))
            base_cmd = [
                str(self.llama_server_bin),
                "-m",
                str(model_path),
                "--host",
                "127.0.0.1",
                "--port",
                str(self.default_port),
                "-c",
                ctx_size,
                "-np",
                "1",
                "-t",
                str(threads),
                "-b",
                "1024",
                "-ub",
                "512",
            ]
            # CuriousLLM Higher-LLM flags: Flash Attention + Quantized KV-Cache
            curious_cmd = [*base_cmd, "-fa", "-ctk", kv_quant, "-ctv", kv_quant]

            logger.info(
                json.dumps(
                    {
                        "event": "spawning_bundled_llama_server_curious_llm",
                        "model": model_path.name,
                        "port": self.default_port,
                        "threads": threads,
                        "ctx_size": ctx_size,
                        "kv_cache_quant": kv_quant,
                    }
                )
            )
            creationflags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
            self._proc = subprocess.Popen(
                curious_cmd,
                cwd=str(self.runtime_dir),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=creationflags,
            )

            await asyncio.sleep(1.2)
            # Fallback if older llama-server binary does not support -ctk / -ctv flags
            if self._proc.poll() is not None:
                self._proc = subprocess.Popen(
                    base_cmd,
                    cwd=str(self.runtime_dir),
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    creationflags=creationflags,
                )

            deadline = time.monotonic() + 45.0
            while time.monotonic() < deadline:
                await asyncio.sleep(0.6)
                info = await self.is_endpoint_alive(self.default_host, timeout=1.5)
                if info:
                    logger.info(
                        json.dumps(
                            {
                                "event": "bundled_llama_server_ready",
                                "url": self.default_host,
                                "model": info["model"],
                            }
                        )
                    )
                    return info

        return None

    async def get_status(self) -> Dict[str, Any]:
        info = await self.ensure_local_llm_server()
        model_path = self.find_local_gguf_model()
        available = [p.name for p in self.list_local_gguf_models()]
        curious_profile = self._probe_system_resources()
        if info:
            extra_models = info.get("all_models", [])
            merged_available = list(dict.fromkeys([*available, *extra_models, info["model"]]))
            return {
                "online": True,
                "endpoint": info["url"],
                "provider": info["type"],
                "model": info["model"],
                "bundled_model": (model_path.name if model_path else info["model"]),
                "available_models": merged_available,
                "curious_llm": curious_profile,
            }
        return {
            "online": False,
            "endpoint": self.default_host,
            "provider": "none",
            "model": None,
            "bundled_model": model_path.name if model_path else None,
            "available_models": available,
            "curious_llm": curious_profile,
        }

    async def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        max_tokens: int = 1200,
        ws_env: Optional[Dict[str, str]] = None,
    ) -> Optional[tuple[str, str]]:
        """
        Generates a response using the active Local LLM (`llama-server` or `Ollama` with
        CuriousLLM higher-parameter model scaling and `<think>` reasoning trace extraction),
        or optional cloud API keys if configured in workspace `.env`.
        """
        env = ws_env or {}
        endpoint_info = await self.ensure_local_llm_server()
        curious_profile = self._probe_system_resources()

        if endpoint_info:
            url = endpoint_info["url"]
            model_id = endpoint_info["model"]
            ptype = endpoint_info["type"]
            is_reasoning_model = any(
                tag in model_id.lower() for tag in ("deepseek-r1", "qwq", "r1", "qwen3")
            )
            effective_max_tokens = (
                max(max_tokens, 2048) if is_reasoning_model else max_tokens
            )
            try:
                async with httpx.AsyncClient(timeout=480.0) as client:
                    if ptype == "openai_compat":
                        resp = await client.post(
                            f"{url}/v1/chat/completions",
                            json={
                                "model": model_id,
                                "temperature": temperature,
                                "max_tokens": effective_max_tokens,
                                "cache_prompt": True,
                                "stop": ["</html>"],
                                "messages": [
                                    {"role": "system", "content": system_prompt},
                                    {"role": "user", "content": user_prompt},
                                ],
                            },
                        )
                        if resp.status_code == 200:
                            choice = resp.json()["choices"][0]
                            raw_content = choice["message"].get("content", "")
                            content = self.strip_reasoning_trace(raw_content)
                            if content and content.strip():
                                return content, f"Local LLM ({model_id} • CuriousLLM)"
                    elif ptype == "ollama":
                        resp = await client.post(
                            f"{url}/api/chat",
                            json={
                                "model": model_id,
                                "stream": False,
                                "keep_alive": "15m",
                                "options": {
                                    "temperature": temperature,
                                    "num_predict": effective_max_tokens,
                                    "num_ctx": curious_profile.get("ctx_size", 8192),
                                    "num_batch": 512,
                                    "stop": ["</html>"],
                                },
                                "messages": [
                                    {"role": "system", "content": system_prompt},
                                    {"role": "user", "content": user_prompt},
                                ],
                            },
                        )
                        if resp.status_code == 200:
                            raw_content = resp.json().get("message", {}).get("content", "")
                            content = self.strip_reasoning_trace(raw_content)
                            if content and content.strip():
                                return content, f"Local Ollama ({model_id} • CuriousLLM)"
            except Exception as exc:
                logger.warning(
                    json.dumps({"event": "local_llm_inference_error", "error": repr(exc)})
                )

        # Optional Cloud API fallback if user explicitly added keys to .env
        openai_key = env.get("OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY")
        if openai_key:
            try:
                async with httpx.AsyncClient(timeout=90.0) as client:
                    resp = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {openai_key}"},
                        json={
                            "model": env.get("OPENAI_MODEL", "gpt-4o-mini"),
                            "temperature": temperature,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt},
                            ],
                        },
                    )
                    if resp.status_code == 200:
                        return resp.json()["choices"][0]["message"]["content"], "OpenAI API"
            except Exception:
                pass

        gemini_key = env.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if gemini_key:
            try:
                model = env.get("GEMINI_MODEL", "gemini-2.0-flash")
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
                async with httpx.AsyncClient(timeout=90.0) as client:
                    resp = await client.post(
                        url,
                        json={
                            "contents": [
                                {
                                    "role": "user",
                                    "parts": [{"text": system_prompt + "\n\n" + user_prompt}],
                                }
                            ]
                        },
                    )
                    if resp.status_code == 200:
                        candidates = resp.json().get("candidates", [])
                        if candidates:
                            return (
                                candidates[0]["content"]["parts"][0]["text"],
                                f"Gemini ({model})",
                            )
            except Exception:
                pass

        return None
