import asyncio
import json
import logging
import os
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger("local_dev_studio.agent.local_llm_manager")


class LocalLLMManager:
    """
    Manages the embedded Local LLM server (`llama-server.exe` + `Qwen2.5-Coder-3B/7B-Instruct-GGUF`)
    as well as external local LLM endpoints (`Ollama` on :11434, `LM Studio` on :1234).
    Automatically starts or upgrades the bundled `llama-server.exe` process with the strongest
    available Qwen2.5-Coder GGUF model (`7B` -> `3B` -> `1.5B`).
    """

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
                    for pattern in ("qwen2.5-coder:7b", "qwen2.5-coder-7b", "qwen2.5-coder:3b", "qwen2.5-coder"):
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
                        # Prefer qwen2.5-coder:7b -> qwen2.5-coder -> first available model
                        preferred = models[0]
                        for pattern in ("qwen2.5-coder:7b", "qwen2.5-coder:3b", "qwen2.5-coder", "qwen"):
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
        Probes configured local LLM servers (`:8080`, `:11434`, `:1234`).
        If `:8080` is running an older/smaller bundled GGUF model than the strongest
        available model on disk (`Qwen2.5-Coder-3B/7B`), automatically restarts `llama-server.exe`
        with the upgraded model.
        """
        target_model_path = self.find_local_gguf_model()

        # Check if our default host (:8080) is alive and whether it needs upgrading to 3B/7B
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
            cmd = [
                str(self.llama_server_bin),
                "-m",
                str(model_path),
                "--host",
                "127.0.0.1",
                "--port",
                str(self.default_port),
                "-c",
                "8192",
                "-np",
                "1",
                "-t",
                str(threads),
                "-b",
                "1024",
                "-ub",
                "512",
            ]
            logger.info(
                json.dumps(
                    {
                        "event": "spawning_bundled_llama_server",
                        "model": model_path.name,
                        "port": self.default_port,
                        "threads": threads,
                    }
                )
            )
            creationflags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
            self._proc = subprocess.Popen(
                cmd,
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
            }
        return {
            "online": False,
            "endpoint": self.default_host,
            "provider": "none",
            "model": None,
            "bundled_model": model_path.name if model_path else None,
            "available_models": available,
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
        Generates a response using the active Local LLM (`llama-server` with Qwen2.5-Coder-7B,
        `Ollama`, or `LM Studio`), or optional cloud API keys if configured in workspace `.env`.
        """
        env = ws_env or {}
        endpoint_info = await self.ensure_local_llm_server()

        if endpoint_info:
            url = endpoint_info["url"]
            model_id = endpoint_info["model"]
            ptype = endpoint_info["type"]
            try:
                async with httpx.AsyncClient(timeout=480.0) as client:
                    if ptype == "openai_compat":
                        resp = await client.post(
                            f"{url}/v1/chat/completions",
                            json={
                                "model": model_id,
                                "temperature": temperature,
                                "max_tokens": max_tokens,
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
                            content = choice["message"]["content"]
                            if content and content.strip():
                                return content, f"Local LLM ({model_id})"
                    elif ptype == "ollama":
                        resp = await client.post(
                            f"{url}/api/chat",
                            json={
                                "model": model_id,
                                "stream": False,
                                "options": {
                                    "temperature": temperature,
                                    "num_predict": max_tokens,
                                    "stop": ["</html>"],
                                },
                                "messages": [
                                    {"role": "system", "content": system_prompt},
                                    {"role": "user", "content": user_prompt},
                                ],
                            },
                        )
                        if resp.status_code == 200:
                            content = resp.json().get("message", {}).get("content", "")
                            if content and content.strip():
                                return content, f"Local Ollama ({model_id})"
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
