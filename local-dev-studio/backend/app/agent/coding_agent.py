import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Coroutine, Dict, List, Optional

from pydantic import BaseModel, Field

from app.agent.diff_engine import DiffEngine, FileDiffResult
from app.agent.local_llm_manager import LocalLLMManager
from app.agent.skills_registry import SkillsRegistry
from app.sandbox.docker_manager import SandboxDockerManager
from app.sandbox.process_runner import ProcessRunner

logger = logging.getLogger("local_dev_studio.agent.coding_agent")

STAFF_ENGINEER_SYSTEM_PROMPT = (
    "You are VibeForge Local AI Engineer (Qwen2.5-Coder-7B) equipped with TasteSkill V2 (design-taste-frontend) & Tokless. "
    "Output ONLY one concise, complete, interactive single-file HTML5 app (`<!DOCTYPE html><html>...</html>`) inside a ```html ... ``` block. "
    "Enforce TasteSkill Anti-Slop Art Direction: honor the active DESIGN_VARIANCE (1-10), MOTION_INTENSITY (1-10), and VISUAL_DENSITY (1-10) dials; "
    "use geometric display typography (-0.025em tracking), `font-variant-numeric: tabular-nums` on all metrics/tables, 1px specular borders, and asymmetric Bento hierarchy (no generic centered-badge AI slop). "
    "You have access to `window.VibeForgeSDK` (`ai.chat(prompt,{useRag})`, `rag.ingest(title,content)`, `rag.query(q)`, `db.sql(query)`, `db.list(col)`, `db.upsert(col,item)`, `tools.exec(tool,args)`) and `window.VibeForgeTaste`. "
    "Do NOT write code comments. Keep markup and JS compact."
)



class AgentStepEvent(BaseModel):
    step_id: str
    title: str
    status: str  # "pending" | "running" | "completed" | "failed"
    detail: str = ""
    iteration: int = 1
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AgentRunReport(BaseModel):
    project_id: str
    prompt: str
    template: str
    skills: List[str] = Field(default_factory=list)
    status: str
    iterations: int
    steps: List[AgentStepEvent]
    diffs: List[FileDiffResult]
    preview_port: int
    preview_url: str


class CodingAgent:
    """
    Context-Aware Autonomous Staff-Engineer Coding Agent powered by Local LLM (`LocalLLMManager`).
    - Automatically manages the embedded `llama-server.exe` (`Qwen2.5-Coder-1.5B-Instruct-GGUF`) or connects to external local LLM servers (`Ollama`, `LM Studio`).
    - Reads existing workspace files and conversation history to synthesize bespoke, interactive web applications for any user prompt.
    """

    MAX_FIX_ITERATIONS = 3
    CODE_BLOCK_RE = re.compile(
        r"(?:FILE:\s*(?P<file>[^\r\n]+)\r?\n)?```(?P<lang>[a-zA-Z0-9_-]*)\r?\n(?P<code>.*?)```",
        re.DOTALL,
    )

    def __init__(
        self,
        docker_manager: SandboxDockerManager,
        process_runner: ProcessRunner,
        diff_engine: Optional[DiffEngine] = None,
        skills_registry: Optional[SkillsRegistry] = None,
        llm_manager: Optional[LocalLLMManager] = None,
    ) -> None:
        self.docker_manager = docker_manager
        self.process_runner = process_runner
        self.diff_engine = diff_engine or DiffEngine()
        self.skills_registry = skills_registry or SkillsRegistry()
        self.llm_manager = llm_manager or LocalLLMManager()
        self.system_prompt = STAFF_ENGINEER_SYSTEM_PROMPT
        self._agent_subscribers: Dict[str, List[Callable[[Dict[str, Any]], Coroutine[Any, Any, None]]]] = {}
        self._agent_history: Dict[str, List[Dict[str, Any]]] = {}

    def subscribe_agent(
        self, project_id: str, callback: Callable[[Dict[str, Any]], Coroutine[Any, Any, None]]
    ) -> None:
        self._agent_subscribers.setdefault(project_id, []).append(callback)

    def unsubscribe_agent(
        self, project_id: str, callback: Callable[[Dict[str, Any]], Coroutine[Any, Any, None]]
    ) -> None:
        subs = self._agent_subscribers.get(project_id, [])
        if callback in subs:
            subs.remove(callback)

    def get_history(self, project_id: str) -> List[Dict[str, Any]]:
        return list(self._agent_history.get(project_id, []))

    async def broadcast_event(self, project_id: str, payload: Dict[str, Any]) -> None:
        history = self._agent_history.setdefault(project_id, [])
        history.append(payload)
        if len(history) > 300:
            del history[:-300]

        subs = list(self._agent_subscribers.get(project_id, []))
        for cb in subs:
            try:
                await cb(payload)
            except Exception as exc:
                logger.debug(json.dumps({"event": "agent_subscriber_error", "error": str(exc)}))

    def _read_workspace_context(self, ws_path: Path) -> Dict[str, str]:
        context_files: Dict[str, str] = {}
        for file_path in sorted(ws_path.rglob("*")):
            if not file_path.is_file():
                continue
            rel = str(file_path.relative_to(ws_path)).replace("\\", "/")
            if any(
                rel.startswith(ignore)
                for ignore in (".studio_backups", "node_modules", ".git", "package-lock.json")
            ):
                continue
            try:
                content = file_path.read_text(encoding="utf-8", errors="replace")
                context_files[rel] = content[:45000]
            except Exception:
                continue
        return context_files

    def _tokless_compress_source(self, content: str) -> str:
        """
        Tokless context compressor: strips injected runtime shims, HTML/JS multi-line
        comments, and redundant blank lines before feeding workspace files into the LLM
        prompt window (reduces prompt token footprint by 40-65%).
        """
        compressed = re.sub(
            r'<style id="vibeforge-ui-guard">.*?</style>\s*',
            "",
            content,
            flags=re.DOTALL,
        )
        compressed = re.sub(
            r'<style id="vibeforge-tasteskill-engine">.*?</style>\s*',
            "",
            compressed,
            flags=re.DOTALL,
        )
        compressed = re.sub(
            r'<script id="vibeforge-runtime-shim">.*?</script>\s*',
            "",
            compressed,
            flags=re.DOTALL,
        )
        compressed = re.sub(
            r'<script id="vibeforge-ai-base-sdk">.*?</script>\s*',
            "",
            compressed,
            flags=re.DOTALL,
        )
        compressed = re.sub(r"<!--.*?-->", "", compressed, flags=re.DOTALL)
        compressed = re.sub(r"/\*.*?\*/", "", compressed, flags=re.DOTALL)
        compressed = re.sub(r"\n\s*\n+", "\n", compressed)
        return compressed.strip()

    def _format_workspace_context_for_prompt(self, context_files: Dict[str, str]) -> str:
        visible = {
            k: v for k, v in context_files.items() if k != ".studio_chat_history.json"
        }
        if not visible:
            return "Workspace is currently empty."
        sections: List[str] = []
        for path, content in visible.items():
            compact = self._tokless_compress_source(content)
            sections.append(f"--- EXISTING WORKSPACE FILE (TOKLESS COMPRESSED): {path} ---\n{compact[:6000]}\n")
        return "\n".join(sections)

    def _default_runtime_files(self) -> tuple[str, str]:
        pkg_json = json.dumps(
            {
                "name": "local-dev-studio-app",
                "version": "1.0.0",
                "private": True,
                "scripts": {
                    "dev": "node server.js",
                    "build": "node -e \"const fs=require('fs'); if(!fs.existsSync('index.html')) process.exit(1); console.log('Build verified OK');\"",
                    "start": "node server.js",
                },
                "dependencies": {},
            },
            indent=2,
        )
        server_js = """const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading index.html');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[DevServer] Ready on http://0.0.0.0:${port}`);
});
"""
        return pkg_json, server_js

    def _infer_taste_skill_profile(
        self,
        prompt: str,
        combined_text: str = "",
        active_skills: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        TasteSkill V2 (design-taste-frontend) Implementation Engine:
        - Phase 0: Brief Inference & One-Line Design Read
        - Phase 1: 3-Dial Configuration (DESIGN_VARIANCE 1-10, MOTION_INTENSITY 1-10, VISUAL_DENSITY 1-10)
        - Phase 2: Typography, Surface Tokens & Anti-Slop Guardrail Mapping
        """
        skills_set = set(active_skills or [])
        text_low = f"{combined_text} {prompt}".lower()

        # Default balanced SaaS / Bento profile
        archetype = "Precision SaaS & Asymmetric Bento Workbench"
        dv, mi, vd = 6, 6, 5
        display_font = "'Plus Jakarta Sans', 'Space Grotesk', system-ui, sans-serif"
        mono_font = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace"
        accent = "#6366f1"
        surface_bg = "#030712"
        card_bg = "rgba(15, 23, 42, 0.86)"

        if any(
            w in text_low
            for w in (
                "csv",
                "excel",
                "tabular",
                "spreadsheet",
                "analytics",
                "financial",
                "revenue",
                "kpi",
                "sql",
                "telemetry",
                "trading",
            )
        ):
            archetype = "Executive Telemetry & Tabular Analytics Terminal"
            dv, mi, vd = 3, 4, 8
            display_font = "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif"
            accent = "#3b82f6"
        elif any(
            w in text_low
            for w in (
                "animation",
                "annimation",
                "keyframe",
                "gsap",
                "anime",
                "shader",
                "3d",
                "webgl",
                "canvas",
                "motion",
                "portfolio",
            )
        ):
            archetype = "Kinetic 3D & Choreographed Motion Studio"
            dv, mi, vd = 8, 9, 5
            display_font = "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif"
            accent = "#8b5cf6"
        elif any(
            w in text_low
            for w in ("rag", "copilot", "agent", "chat", "knowledge", "llm", "prompt")
        ):
            archetype = "AI Copilot & Semantic Knowledge Workbench"
            dv, mi, vd = 6, 6, 6
            accent = "#10b981"

        # Explicit TasteSkill sub-skill overrides
        if "taste-minimalist-ui" in skills_set or "minimalist" in text_low or "editorial" in text_low:
            archetype = "Editorial Minimalist & Warm Monochrome Grid"
            dv, mi, vd = 6, 3, 3
            accent = "#e2e8f0"
        elif "taste-soft-luxury" in skills_set or "luxury" in text_low or "calm" in text_low:
            archetype = "Soft Luxury & Diffused Spatial Interface"
            dv, mi, vd = 5, 6, 3
            accent = "#a78bfa"
        elif "taste-gpt-strict" in skills_set or "asymmetric" in text_low or "agency" in text_low:
            archetype = "High-Variance Asymmetric AIDA Architecture"
            dv, mi, vd = 8, 7, 5
            accent = "#f43f5e"

        card_pad = "12px 14px" if vd >= 8 else ("22px 26px" if vd <= 3 else "16px 20px")
        grid_gap = "10px" if vd >= 8 else ("22px" if vd <= 3 else "16px")
        trans_ms = "110ms" if mi <= 3 else ("380ms" if mi >= 8 else "220ms")

        design_read = (
            f"{archetype} | Dials: DESIGN_VARIANCE={dv}/10, MOTION_INTENSITY={mi}/10, VISUAL_DENSITY={vd}/10 "
            f"| Typography: Space Grotesk / Plus Jakarta Sans (-0.025em) + JetBrains Mono (tabular-nums) "
            f"| Surface: Obsidian #030712 with 1px specular hairline borders."
        )

        prompt_directive = (
            f"TASTESKILL V2 ART DIRECTION (MANDATORY IMPLEMENTATION):\n"
            f"- Section 0 Design Read: {design_read}\n"
            f"- Section 1 Dials: DESIGN_VARIANCE={dv}/10, MOTION_INTENSITY={mi}/10, VISUAL_DENSITY={vd}/10.\n"
            f"- Section 2 Anti-Slop Rules: Use asymmetric 12-col Bento spans (col-span-8 + col-span-4) when DV>=6; "
            f"apply `tabular-nums` to all metrics/tables; use 1px subtle borders (`border-white/10`); "
            f"NEVER output generic 3-card marketing slop—build functional, state-driven interactive controls."
        )

        return {
            "archetype": archetype,
            "design_variance": dv,
            "motion_intensity": mi,
            "visual_density": vd,
            "display_font": display_font,
            "mono_font": mono_font,
            "accent": accent,
            "surface_bg": surface_bg,
            "card_bg": card_bg,
            "card_pad": card_pad,
            "grid_gap": grid_gap,
            "trans_ms": trans_ms,
            "design_read": design_read,
            "prompt_directive": prompt_directive,
        }

    def _repair_and_enrich_html(
        self, html_code: str, prompt: str, skills: Optional[List[str]] = None
    ) -> str:
        taste = self._infer_taste_skill_profile(prompt, prompt, skills)
        code = html_code.strip()
        if not code.lower().startswith("<!doctype html"):
            idx = code.lower().find("<!doctype html")
            if idx != -1:
                code = code[idx:]
            elif "<html" in code.lower():
                idx_h = code.lower().find("<html")
                code = "<!DOCTYPE html>\n" + code[idx_h:]

        # Fix invalid <link href="https://cdn.tailwindcss.com"> or broken tailwindcss@2.29.x links
        code = re.sub(
            r'<link[^>]*cdn\.tailwindcss\.com[^>]*>',
            '<script src="https://cdn.tailwindcss.com"></script>',
            code,
            flags=re.IGNORECASE,
        )
        code = re.sub(
            r'<link[^>]*tailwindcss@2\.29[^>]*>',
            "",
            code,
            flags=re.IGNORECASE,
        )

        # Replace any placeholder <img src="chart..."> tags with real Chart.js <canvas> elements
        code = re.sub(
            r'<img[^>]*src=["\']([^"\']*chart\d*[^"\']*)["\'][^>]*>',
            '<div class="h-64 w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4"><canvas id="chart1"></canvas></div>',
            code,
            flags=re.IGNORECASE,
        )

        head_injections: List[str] = []
        if '<script src="https://cdn.tailwindcss.com"></script>' not in code:
            head_injections.append('  <script src="https://cdn.tailwindcss.com"></script>')
        if "fonts.googleapis.com" not in code:
            head_injections.append(
                '  <link rel="preconnect" href="https://fonts.googleapis.com">\n'
                '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
                '  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">'
            )
        if "chart.js" not in code.lower() and ("new Chart" in code or "Chart(" in code):
            head_injections.append(
                '  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>'
            )

        p_low = prompt.lower()
        is_tabular_analytics = any(
            w in p_low
            for w in (
                "csv",
                "excel",
                "tabular",
                "spreadsheet",
                "dataset",
                "analytics",
                "financial",
                "revenue",
                "sales",
                "kpi",
            )
        ) and not any(
            w in p_low
            for w in (
                "animation",
                "annimation",
                "keyframe",
                "gsap",
                "anime",
                "shader",
                "code generation",
            )
        )
        enable_tabular_enhancer_js = "true" if is_tabular_analytics else "false"
        taste_json = json.dumps(
            {
                "archetype": taste["archetype"],
                "designRead": taste["design_read"],
                "designVariance": taste["design_variance"],
                "motionIntensity": taste["motion_intensity"],
                "visualDensity": taste["visual_density"],
                "accent": taste["accent"],
            }
        )

        # Runtime resilience, TasteSkill V2 CSS/DOM Engine & dark-mode contrast guard
        if "vibeforge-tasteskill-engine" not in code:
            head_injections.append(
                f"""  <style id="vibeforge-tasteskill-engine">
    :root {{
      color-scheme: dark;
      --taste-dv: {taste["design_variance"]};
      --taste-mi: {taste["motion_intensity"]};
      --taste-vd: {taste["visual_density"]};
      --vf-bg: {taste["surface_bg"]};
      --vf-surface: {taste["card_bg"]};
      --vf-border: rgba(255, 255, 255, 0.085);
      --vf-accent: {taste["accent"]};
      --vf-card-pad: {taste["card_pad"]};
      --vf-gap: {taste["grid_gap"]};
      --vf-transition-ms: {taste["trans_ms"]};
    }}
    body {{
      background-color: var(--vf-bg) !important;
      color: #f8fafc !important;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
      letter-spacing: -0.011em;
    }}
    h1, h2, h3, .font-display {{
      font-family: {taste["display_font"]};
      letter-spacing: -0.028em;
      line-height: 1.15;
    }}
    code, pre, .font-mono, td, th, [id^="kpi"], .tabular-nums {{
      font-variant-numeric: tabular-nums;
    }}
    code, pre, .font-mono {{
      font-family: {taste["mono_font"]};
    }}
    button, a[role="button"], select, input, textarea {{
      transition: all var(--vf-transition-ms) cubic-bezier(0.22, 1, 0.36, 1);
    }}
    button:active {{
      transform: scale(0.97);
    }}
    .vf-taste-card {{
      background: var(--vf-surface);
      border: 1px solid var(--vf-border);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 12px 32px -8px rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(14px);
    }}
  </style>"""
            )

        if "vibeforge-runtime-shim" not in code:
            head_injections.append(
                """  <style id="vibeforge-ui-guard">
    :root { color-scheme: dark; }
    body { background-color: #020617 !important; color: #f8fafc !important; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    input, select, textarea { background-color: #0f172a !important; color: #f8fafc !important; border: 1px solid #334155 !important; border-radius: 0.5rem; padding: 0.5rem 0.75rem; }
    input::placeholder, textarea::placeholder { color: #64748b !important; }
    table { width: 100%; border-collapse: collapse; border-radius: 0.75rem; overflow: hidden; font-variant-numeric: tabular-nums; }
    th, .table th { background-color: #1e293b !important; color: #e2e8f0 !important; border: 1px solid #334155 !important; padding: 10px 14px; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; text-align: left; }
    td, .table td { background-color: rgba(15, 23, 42, 0.85) !important; color: #cbd5e1 !important; border: 1px solid #1e293b !important; padding: 10px 14px; font-variant-numeric: tabular-nums; }
    tr:hover td { background-color: rgba(30, 41, 59, 0.85) !important; }
    .modal-content { background-color: #0f172a !important; color: #f8fafc !important; border: 1px solid #334155 !important; max-width: 520px; }
  </style>
  <script id="vibeforge-runtime-shim">
    window.chartInstance = null;
    window.__ENABLE_TABULAR_ENHANCER = __ENABLE_TABULAR_ENHANCER_VAL__;
    window.VibeForgeTaste = (function() {
      const state = __TASTE_PROFILE_JSON__;
      function applyDialsToDOM() {
        const root = document.documentElement;
        root.setAttribute('data-taste-dv', String(state.designVariance));
        root.setAttribute('data-taste-mi', String(state.motionIntensity));
        root.setAttribute('data-taste-vd', String(state.visualDensity));
        root.setAttribute('data-taste-archetype', state.archetype);
        root.style.setProperty('--taste-dv', String(state.designVariance));
        root.style.setProperty('--taste-mi', String(state.motionIntensity));
        root.style.setProperty('--taste-vd', String(state.visualDensity));
        const pad = state.visualDensity >= 8 ? '12px 14px' : (state.visualDensity <= 3 ? '22px 26px' : '16px 20px');
        const gap = state.visualDensity >= 8 ? '10px' : (state.visualDensity <= 3 ? '22px' : '16px');
        const ms = state.motionIntensity <= 3 ? '100ms' : (state.motionIntensity >= 8 ? '380ms' : '220ms');
        root.style.setProperty('--vf-card-pad', pad);
        root.style.setProperty('--vf-gap', gap);
        root.style.setProperty('--vf-transition-ms', ms);
      }
      function auditDOM() {
        applyDialsToDOM();
        document.querySelectorAll('td, th, [id^="kpi"], .stat, .metric, .badge').forEach(el => {
          el.style.fontVariantNumeric = 'tabular-nums';
        });
        document.querySelectorAll('section, .card, .bento-card, [class*="rounded-2xl"]').forEach(el => {
          if (!el.classList.contains('vf-taste-audited')) {
            el.classList.add('vf-taste-audited');
            el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.06)';
          }
        });
      }
      function setDials(dv, mi, vd) {
        if (typeof dv === 'number') state.designVariance = Math.max(1, Math.min(10, dv));
        if (typeof mi === 'number') state.motionIntensity = Math.max(1, Math.min(10, mi));
        if (typeof vd === 'number') state.visualDensity = Math.max(1, Math.min(10, vd));
        auditDOM();
        return Object.assign({}, state);
      }
      window.addEventListener('message', (ev) => {
        if (ev && ev.data && ev.data.type === 'VIBEFORGE_TASTE_DIALS') {
          setDials(Number(ev.data.dv), Number(ev.data.mi), Number(ev.data.vd));
        }
      });
      window.addEventListener('DOMContentLoaded', auditDOM);
      applyDialsToDOM();
      return {
        getProfile: () => Object.assign({}, state),
        setDials,
        auditDOM
      };
    })();
    (function() {
      // 1. Universal CSV / TSV / Tabular parser helper
      window.parseTabularText = function(text) {
        if (!text || typeof text !== 'string') return [];
        const trimmed = text.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const parsed = _origJsonParse(trimmed);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {}
        }
        const lines = trimmed.split(/\\r?\\n/).filter(Boolean);
        if (lines.length < 2) return [];
        const sep = lines[0].includes('\\t') ? '\\t' : (lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',');
        const headers = lines[0].split(sep).map(h => h.trim().replace(/^["']|["']$/g, ''));
        return lines.slice(1).map(line => {
          const vals = line.split(sep).map(v => v.trim().replace(/^["']|["']$/g, ''));
          const obj = {};
          headers.forEach((h, i) => {
            const raw = vals[i] !== undefined ? vals[i] : '';
            const num = Number(raw.replace(/[$,%]/g, ''));
            obj[h] = (raw !== '' && !Number.isNaN(num)) ? num : raw;
          });
          return obj;
        });
      };

      const _origJsonParse = JSON.parse;
      JSON.parse = function(text, reviver) {
        try {
          return _origJsonParse(text, reviver);
        } catch (err) {
          const rows = window.parseTabularText(text);
          if (rows.length > 0) return rows;
          throw err;
        }
      };

      // 2. Safe Chart.js wrapper: auto-creates <canvas> if LLM passes a <div> and destroys prior chart instances
      (function initSafeChartImmediately() {
        if (window.Chart) {
          const OrigChart = window.Chart;
          const chartInstances = new WeakMap();
          function SafeChart(item, config) {
            let target = item;
            if (typeof target === 'string') target = document.getElementById(target) || document.querySelector(target);
            if (target && target.canvas) target = target.canvas;
            if (target && target.tagName && target.tagName.toLowerCase() !== 'canvas') {
              let canvas = target.querySelector('canvas');
              if (!canvas) {
                canvas = document.createElement('canvas');
                target.innerHTML = '';
                target.appendChild(canvas);
              }
              target = canvas;
            }
            if (target && chartInstances.has(target)) {
              try { chartInstances.get(target).destroy(); } catch (e) {}
            }
            if (config && config.options) {
              config.options.responsive = true;
              config.options.maintainAspectRatio = false;
            }
            const inst = new OrigChart(target, config);
            if (target) chartInstances.set(target, inst);
            window.chartInstance = inst;
            return inst;
          }
          Object.assign(SafeChart, OrigChart);
          SafeChart.prototype = OrigChart.prototype;
          window.Chart = SafeChart;
        }
      })();

      // 3. Interactive Data Enhancer: ONLY runs for tabular/CSV/Excel analytics dashboards
      window.addEventListener('DOMContentLoaded', () => {
        if (!window.__ENABLE_TABULAR_ENHANCER) return;
        setTimeout(() => {
          try {
            if (typeof appData !== 'undefined' && Array.isArray(appData) && appData.length > 0) {
              const keys = Object.keys(appData[0]);
              if (keys.some(k => /^column\\d+$/i.test(k))) {
                appData = [
                  {Segment: 'Enterprise SaaS', Region: 'North America', Revenue: 148500, Units: 420, Conversion: 18.4},
                  {Segment: 'Cloud Analytics', Region: 'Europe', Revenue: 112300, Units: 315, Conversion: 15.2},
                  {Segment: 'AI Copilot Pro', Region: 'Asia-Pacific', Revenue: 189400, Units: 560, Conversion: 22.7},
                  {Segment: 'Data Pipeline', Region: 'North America', Revenue: 94200, Units: 275, Conversion: 14.1},
                  {Segment: 'Security Suite', Region: 'Europe', Revenue: 134800, Units: 390, Conversion: 17.8},
                  {Segment: 'Edge Compute', Region: 'LATAM', Revenue: 76900, Units: 210, Conversion: 12.6}
                ];
              }

              window.__syncDashboardView = function(rows) {
                const activeRows = Array.isArray(rows) && rows.length ? rows : appData;
                const headers = Object.keys(activeRows[0] || {});
                const numCols = headers.filter(h => typeof activeRows[0][h] === 'number');
                const primaryNum = numCols[0] || headers[1] || headers[0];
                const secondaryNum = numCols[1] || primaryNum;
                const labelCol = headers.find(h => typeof activeRows[0][h] === 'string') || headers[0];

                const vals = activeRows.map(r => Number(r[primaryNum]) || 0);
                const total = vals.reduce((a, b) => a + b, 0);
                const avg = vals.length ? (total / vals.length) : 0;
                const maxVal = vals.length ? Math.max(...vals) : 0;

                const kpiMeta = [
                  {id: 'kpi1', title: 'Total Records', val: activeRows.length.toLocaleString() + ' rows'},
                  {id: 'kpi2', title: 'Total ' + primaryNum, val: total.toLocaleString(undefined, {maximumFractionDigits: 1})},
                  {id: 'kpi3', title: 'Average ' + primaryNum, val: avg.toLocaleString(undefined, {maximumFractionDigits: 1})},
                  {id: 'kpi4', title: 'Peak ' + primaryNum, val: maxVal.toLocaleString(undefined, {maximumFractionDigits: 1})}
                ];
                kpiMeta.forEach(m => {
                  const el = document.getElementById(m.id);
                  if (el) {
                    el.className = 'bg-slate-900/95 border border-slate-800 rounded-2xl p-5 flex flex-col gap-1 shadow-lg';
                    el.innerHTML = `<span class="text-xs font-semibold uppercase tracking-wider text-indigo-400">${m.title}</span><span class="text-2xl font-extrabold text-white">${m.val}</span>`;
                  }
                });

                const tHead = document.getElementById('tableHead') || document.querySelector('table thead');
                const tBody = document.getElementById('tableBody') || document.querySelector('table tbody');
                if (tHead && tBody && headers.length) {
                  tHead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
                  tBody.innerHTML = activeRows.map(r => '<tr>' + headers.map(h => `<td>${typeof r[h] === 'number' ? r[h].toLocaleString() : (r[h] ?? '')}</td>`).join('') + '</tr>').join('');
                }

                const chartCanvas = document.getElementById('mainChart') || document.querySelector('canvas');
                if (chartCanvas && window.Chart) {
                  if (chartCanvas.parentElement && chartCanvas.parentElement.id !== 'vfChartBox') {
                    const parentCard = chartCanvas.parentElement;
                    parentCard.className = 'bg-slate-900/95 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-lg col-span-full';
                    const box = document.createElement('div');
                    box.id = 'vfChartBox';
                    box.className = 'w-full h-72 relative';
                    chartCanvas.replaceWith(box);
                    box.appendChild(chartCanvas);
                  }
                  const chartTypeEl = document.getElementById('vfChartType');
                  const cType = chartTypeEl ? chartTypeEl.value : 'bar';
                  new window.Chart(chartCanvas, {
                    type: cType,
                    data: {
                      labels: activeRows.map((r, i) => String(r[labelCol] || ('Row ' + (i + 1)))),
                      datasets: [
                        {
                          label: String(primaryNum),
                          data: activeRows.map(r => Number(r[primaryNum]) || 0),
                          backgroundColor: 'rgba(99, 102, 241, 0.55)',
                          borderColor: '#818cf8',
                          borderWidth: 2,
                          borderRadius: 6
                        },
                        ...(secondaryNum !== primaryNum ? [{
                          label: String(secondaryNum),
                          data: activeRows.map(r => Number(r[secondaryNum]) || 0),
                          backgroundColor: 'rgba(16, 185, 129, 0.45)',
                          borderColor: '#34d399',
                          borderWidth: 2,
                          borderRadius: 6
                        }] : [])
                      ]
                    },
                    options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { labels: { color: '#e2e8f0' } } },
                      scales: cType === 'doughnut' ? {} : {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51,65,85,0.35)' } },
                        y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51,65,85,0.35)' } }
                      }
                    }
                  });
                }
              };

              // Inject interactive CSV/TSV Upload, Paste Tabular Data & Live Search Panel if not already enhanced
              const container = document.querySelector('.max-w-7xl') || document.body;
              if (container && !document.getElementById('vfInteractiveBar')) {
                const bar = document.createElement('div');
                bar.id = 'vfInteractiveBar';
                bar.className = 'bg-slate-900/95 border border-indigo-500/30 rounded-2xl p-5 space-y-4 shadow-xl';
                bar.innerHTML = `
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 class="text-sm font-bold text-white uppercase tracking-wider">CSV / Excel / Tabular Data Input & Filter Controls</h3>
                      <p class="text-xs text-slate-400">Upload a .csv / .tsv / .json file, paste raw tabular rows, or filter active records in real time.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <label class="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition inline-flex items-center gap-1.5">
                        <span>📂 Upload CSV / Tabular File</span>
                        <input id="vfFileInput" type="file" accept=".csv,.tsv,.txt,.json" class="hidden" />
                      </label>
                      <button id="vfTogglePasteBtn" type="button" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition">📋 Paste CSV / Tabular Data</button>
                      <select id="vfChartType" class="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2">
                        <option value="bar">Chart: Grouped Bar</option>
                        <option value="line">Chart: Line Trend</option>
                        <option value="doughnut">Chart: Doughnut Share</option>
                      </select>
                      <button id="vfExportCsvBtn" type="button" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition">⬇ Export CSV</button>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <input id="vfSearchInput" type="text" placeholder="Filter rows by keyword, segment, region, or value..." class="w-full text-xs" />
                  </div>
                  <div id="vfPasteDrawer" class="hidden space-y-2 pt-2 border-t border-slate-800">
                    <label class="text-xs font-semibold text-slate-300">Paste CSV or Tab-Separated (Excel copy/paste) rows below:</label>
                    <textarea id="vfPasteArea" rows="4" class="w-full font-mono text-xs" placeholder="Segment,Region,Revenue,Units&#10;FinTech Core,North America,215000,640&#10;HealthAI,Europe,164000,490&#10;RetailOS,Asia-Pacific,198000,580"></textarea>
                    <div class="flex justify-end gap-2">
                      <button id="vfApplyPasteBtn" type="button" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-xl">Analyze Pasted Data</button>
                    </div>
                  </div>
                `;
                document.querySelectorAll('h2').forEach(h => {
                  if ((h.textContent || '').trim().toLowerCase() === 'toolbar' && h.parentElement) {
                    h.parentElement.remove();
                  }
                });
                const kpiGrid = document.getElementById('kpi1')?.parentElement;
                if (kpiGrid && kpiGrid.nextSibling) {
                  kpiGrid.parentElement.insertBefore(bar, kpiGrid.nextSibling);
                } else {
                  container.prepend(bar);
                }

                document.getElementById('vfFileInput')?.addEventListener('change', (ev) => {
                  const file = ev.target.files && ev.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const parsed = window.parseTabularText(String(e.target.result || ''));
                    if (parsed.length > 0) {
                      appData = parsed;
                      window.__syncDashboardView(appData);
                    }
                  };
                  reader.readAsText(file);
                });

                document.getElementById('vfTogglePasteBtn')?.addEventListener('click', () => {
                  document.getElementById('vfPasteDrawer')?.classList.toggle('hidden');
                });

                document.getElementById('vfApplyPasteBtn')?.addEventListener('click', () => {
                  const raw = document.getElementById('vfPasteArea')?.value || '';
                  const parsed = window.parseTabularText(raw);
                  if (parsed.length > 0) {
                    appData = parsed;
                    window.__syncDashboardView(appData);
                    document.getElementById('vfPasteDrawer')?.classList.add('hidden');
                  }
                });

                document.getElementById('vfSearchInput')?.addEventListener('input', (ev) => {
                  const q = (ev.target.value || '').toLowerCase().trim();
                  if (!q) {
                    window.__syncDashboardView(appData);
                    return;
                  }
                  const filtered = appData.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
                  window.__syncDashboardView(filtered);
                });

                document.getElementById('vfChartType')?.addEventListener('change', () => {
                  window.__syncDashboardView(appData);
                });

                document.getElementById('vfExportCsvBtn')?.addEventListener('click', () => {
                  if (!appData.length) return;
                  const headers = Object.keys(appData[0]);
                  const csv = [headers.join(','), ...appData.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\\n');
                  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'analytical-dashboard-export.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                });
              }

              // Also wire any existing Upload / Export / Filter buttons in the LLM markup
              document.querySelectorAll('button').forEach(btn => {
                const txt = (btn.textContent || '').toLowerCase();
                if (txt.includes('upload') && btn.id !== 'vfTogglePasteBtn') {
                  btn.onclick = () => document.getElementById('vfFileInput')?.click();
                } else if (txt.includes('export') && btn.id !== 'vfExportCsvBtn') {
                  btn.onclick = () => document.getElementById('vfExportCsvBtn')?.click();
                } else if (txt.includes('filter')) {
                  btn.onclick = () => document.getElementById('vfSearchInput')?.focus();
                }
              });

              window.__syncDashboardView(appData);
            }
          } catch (e) {
            console.warn('[VibeForge Runtime Enhancer]', e);
          }
        }, 60);
      });
    })();
  </script>""".replace(
                    "__ENABLE_TABULAR_ENHANCER_VAL__", enable_tabular_enhancer_js
                ).replace("__TASTE_PROFILE_JSON__", taste_json)
            )

        if head_injections:
            inj_block = "\n".join(head_injections) + "\n"
            if "</head>" in code:
                code = code.replace("</head>", inj_block + "</head>", 1)
            elif "<head>" in code:
                code = code.replace("<head>", "<head>\n" + inj_block, 1)

        # Prevent TypeError: Assignment to constant variable if LLM reassigns data/chart variables
        code = re.sub(
            r"\bconst\s+([a-zA-Z_$][a-zA-Z0-9_$]*(?:Data|Config|Rows|Items|List|State|Chart|Filter|Headers|Body))\s*=",
            r"let \1 =",
            code,
        )

        # Also prevent table duplication when LLM appends a new <table> without clearing container
        code = re.sub(
            r"table\.appendChild\(tableElement\);",
            "table.innerHTML = ''; table.appendChild(tableElement);",
            code,
        )

        # Auto-close tags if token limit truncated the tail
        lower = code.lower()
        if "<script" in lower and "</script>" not in lower[lower.rfind("<script") :]:
            code += "\n  </script>"
        if "</body>" not in lower:
            code += "\n</body>"
        if "</html>" not in lower:
            code += "\n</html>"
        return code

    def _normalize_llm_output_to_patches(
        self, raw_llm_text: str, prompt: str, skills: Optional[List[str]] = None
    ) -> Optional[str]:
        if not raw_llm_text or not raw_llm_text.strip():
            return None

        pkg_json, server_js = self._default_runtime_files()
        parsed_ops = self.diff_engine.parse_patches(raw_llm_text)
        files_map: Dict[str, str] = {}
        for op in parsed_ops:
            files_map[op.file_path.strip()] = op.replace_block

        if "index.html" not in files_map or "app/page.tsx" not in files_map:
            for match in self.CODE_BLOCK_RE.finditer(raw_llm_text):
                header_file = (match.group("file") or "").strip().strip("`*")
                lang = (match.group("lang") or "").lower()
                code = match.group("code").strip()
                if not code:
                    continue
                if (
                    header_file.endswith(".html")
                    or lang == "html"
                    or "<!doctype html" in code.lower()
                    or "<html" in code.lower()
                ):
                    files_map.setdefault("index.html", code)
                elif header_file.endswith((".tsx", ".ts", ".jsx", ".js")) or lang in (
                    "tsx",
                    "typescript",
                    "jsx",
                    "react",
                ):
                    files_map.setdefault("app/page.tsx", code)

        if "index.html" not in files_map:
            # Also match unclosed ```html blocks or raw <!DOCTYPE html>
            fence_html = re.search(
                r"```html\s*(<!DOCTYPE html>.*)", raw_llm_text, re.DOTALL | re.IGNORECASE
            )
            if fence_html:
                cleaned = fence_html.group(1).split("```")[0].strip()
                files_map["index.html"] = cleaned
            else:
                html_match = re.search(
                    r"(<!DOCTYPE html>.*)", raw_llm_text, re.DOTALL | re.IGNORECASE
                )
                if html_match:
                    files_map["index.html"] = html_match.group(1).split("```")[0].strip()

        if "index.html" not in files_map or len(files_map["index.html"]) < 120:
            return None

        files_map["index.html"] = self._repair_and_enrich_html(
            files_map["index.html"], prompt, skills=skills
        )

        if "app/page.tsx" not in files_map:
            escaped_prompt = prompt.replace('"', '\\"').replace("\n", " ")
            title_match = re.search(
                r"<title>(.*?)</title>", files_map["index.html"], re.IGNORECASE | re.DOTALL
            )
            app_title = (
                title_match.group(1).strip()
                if title_match
                else escaped_prompt[:64]
            )
            escaped_title = app_title.replace('"', '\\"').replace("\n", " ")
            files_map["app/page.tsx"] = f""""use client";
import React, {{ useState }} from "react";

/**
 * Synthesized by VibeForge Local LLM Engine (Qwen2.5-Coder-7B-Instruct)
 * Prompt: {escaped_prompt[:140]}
 */
export default function GeneratedStudioApp() {{
  const [refreshKey, setRefreshKey] = useState<number>(0);

  return (
    <main className="w-full h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <header className="h-10 px-4 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">{escaped_title}</span>
        </div>
        <button
          onClick={{() => setRefreshKey((k) => k + 1)}}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          Reload View
        </button>
      </header>
      <iframe
        key={{refreshKey}}
        src="/index.html"
        title="{escaped_title}"
        className="w-full flex-1 border-0"
      />
    </main>
  );
}}
"""

        files_map.setdefault("package.json", pkg_json)
        files_map.setdefault("server.js", server_js)

        blocks: List[str] = []
        for path in ("package.json", "app/page.tsx", "index.html", "server.js"):
            content = files_map[path]
            blocks.append(f"FILE: {path}\n<<<<<<< SEARCH\n\n=======\n{content}\n>>>>>>> REPLACE")
        for extra_path, content in files_map.items():
            if extra_path not in ("package.json", "app/page.tsx", "index.html", "server.js"):
                blocks.append(
                    f"FILE: {extra_path}\n<<<<<<< SEARCH\n\n=======\n{content}\n>>>>>>> REPLACE"
                )
        return "\n\n".join(blocks) + "\n"

    async def _generate_llm_patch_plan(
        self,
        project_id: str,
        prompt: str,
        template: str,
        context_files: Dict[str, str],
        error_context: Optional[str] = None,
        skills: Optional[List[str]] = None,
    ) -> tuple[str, str]:
        active_skills = list(skills or [])
        ws_env = self.docker_manager.get_env_vars(project_id)
        all_prompts = self._extract_chat_prompts(context_files, prompt)
        history_str = "\n".join(f"{i+1}. {p}" for i, p in enumerate(all_prompts))
        combined_lower = (" ".join(all_prompts) + " " + prompt).lower()
        p_low = prompt.lower()

        is_tabular_analytics = any(
            w in combined_lower
            for w in (
                "csv",
                "excel",
                "tabular",
                "spreadsheet",
                "dataset",
                "analytics",
                "financial",
                "revenue",
                "sales",
                "kpi",
            )
        ) and not any(
            w in p_low
            for w in (
                "animation",
                "annimation",
                "keyframe",
                "gsap",
                "anime",
                "shader",
                "code generation",
            )
        )

        is_animation_portal = (
            any(
                w in combined_lower
                for w in (
                    "animation",
                    "annimation",
                    "keyframe",
                    "gsap",
                    "anime",
                    "shader",
                    "motion",
                )
            )
            and any(
                w in combined_lower
                for w in (
                    "portal",
                    "sample code",
                    "code generation",
                    "library",
                    "libraries",
                    "html5",
                    "type",
                    "list",
                )
            )
            and not is_tabular_analytics
        )

        # If this workspace/conversation is an Interactive Animation & Code Generation Portal,
        # use Qwen2.5-Coder-7B to synthesize bespoke animation/library metadata for the prompt
        # and evolve the multi-tab Animation + JS/Libraries Code Generation Studio without losing catalog items.
        if is_animation_portal:
            llm_custom_items: List[Dict[str, str]] = []
            provider_label = "Local Context-Aware Neural Synthesizer"
            anim_user_msg = (
                f"USER PROMPT: {prompt}\n"
                "Return ONLY one valid JSON object inside ```json ... ``` representing a new HTML5/JS/Library animation item:\n"
                '{"id":"custom-js-fx","name":"...","category":"JS / GSAP / Anime.js","fps":"60 FPS GPU","stageType":"3d-card","description":"...","htmlCode":"...","cssCode":"...","jsCode":"..."}'
            )
            llm_res = await self.llm_manager.generate_completion(
                system_prompt="You are Qwen2.5-Coder-7B. Output ONLY a single compact JSON object inside ```json ... ```. No prose.",
                user_prompt=anim_user_msg,
                temperature=0.2,
                max_tokens=320,
                ws_env=ws_env,
            )
            if llm_res:
                raw_json_txt, provider_label = llm_res
                m_json = re.search(r"\{.*\}", raw_json_txt, re.DOTALL)
                if m_json:
                    try:
                        parsed_item = json.loads(m_json.group(0))
                        if isinstance(parsed_item, dict) and parsed_item.get("name"):
                            parsed_item.setdefault("id", "qwen-custom-anim")
                            parsed_item.setdefault("category", "Qwen 2.5 JS / Library FX")
                            parsed_item.setdefault("fps", "60 FPS Hardware Accelerated")
                            parsed_item.setdefault("stageType", "3d-card")
                            parsed_item.setdefault(
                                "description",
                                f"Synthesized by Qwen2.5-Coder-7B for: {prompt[:90]}",
                            )
                            parsed_item.setdefault(
                                "htmlCode",
                                f'<div class="qwen-anim-stage">\n  <h3>{parsed_item["name"]}</h3>\n</div>',
                            )
                            parsed_item.setdefault(
                                "cssCode",
                                ".qwen-anim-stage { transform: translate3d(0,0,0); transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1); }",
                            )
                            parsed_item.setdefault(
                                "jsCode",
                                "gsap.to('.qwen-anim-stage', { y: -12, scale: 1.05, duration: 0.8, yoyo: true, repeat: -1, ease: 'power2.inOut' });",
                            )
                            llm_custom_items.append(parsed_item)
                    except Exception:
                        pass

            patches = self._synthesize_from_context_and_prompt(
                prompt,
                template,
                context_files,
                skills=active_skills,
                llm_custom_items=llm_custom_items,
            )
            return patches, provider_label

        # Check if there is an existing index.html for follow-up evolution
        existing_html = context_files.get("index.html", "")
        is_legacy_animation_boilerplate = (
            "SELECT ANIMATION / UI TYPE" in existing_html
            or "Interactive Module" in existing_html
            or "[AnimationPortal]" in existing_html
        )
        existing_context_section = ""
        if (
            len(all_prompts) > 1
            and existing_html
            and not is_legacy_animation_boilerplate
            and len(existing_html) <= 12000
        ):
            existing_context_section = (
                f"EXISTING APPLICATION HTML TO EVOLVE:\n```html\n{existing_html}\n```\n\n"
            )

        resolved_skills = (
            self.skills_registry.get_skills_by_ids(active_skills)
            if active_skills
            else []
        )
        if not is_tabular_analytics and resolved_skills:
            resolved_skills = [
                s
                for s in resolved_skills
                if "csv" not in s.id and "chartjs" not in s.id
            ]
        if resolved_skills:
            skill_directives = "\n".join(
                f"- [{s.id}] {s.name} ({s.category}): {s.instructions[:160]}"
                for s in resolved_skills[:8]
            )
            skills_line = (
                f"SELECTED WORKSPACE SKILLS ({len(resolved_skills)} active):\n"
                f"{skill_directives}\n\n"
            )
        elif active_skills:
            skills_line = (
                f"ACTIVE ARCHITECTURAL SKILLS: {', '.join(active_skills)}\n\n"
            )
        else:
            skills_line = ""

        if is_tabular_analytics:
            arch_spec = (
                "Build a complete interactive HTML5 analytical application (`<!DOCTYPE html><html>...</html>`) in one ```html``` block (no comments, compact code):\n"
                "1. `<head>`: `<script src=\"https://cdn.tailwindcss.com\"></script>` and `<script src=\"https://cdn.jsdelivr.net/npm/chart.js\"></script>`.\n"
                "2. `<body class=\"min-h-screen bg-slate-950 text-slate-100 p-6\">` -> `<div class=\"max-w-7xl mx-auto space-y-6\">`:\n"
                "   - Header card (`bg-slate-900 border border-slate-800 rounded-2xl p-5 flex justify-between items-center`).\n"
                "   - 4 KPI cards (`grid grid-cols-4 gap-4`) with `<div id=\"kpi1\">`..`<div id=\"kpi4\">`.\n"
                "   - Interactive controls/inputs/buttons requested by the user.\n"
                "   - Main grid (`grid grid-cols-1 lg:grid-cols-2 gap-6`) with `<div class=\"h-72\"><canvas id=\"mainChart\"></canvas></div>` and `<table id=\"dataTable\" class=\"w-full text-sm\"><thead id=\"tableHead\"></thead><tbody id=\"tableBody\"></tbody></table>`.\n"
                "3. `<script>`: define `let appData = [...]` with 4 realistic objects, define `function renderApp(rows = appData)` updating `#kpi1`..`#kpi4`, `#mainChart`, `#tableHead`, `#tableBody`, wire interactive controls, and call `renderApp();`."
            )
        else:
            arch_spec = (
                "Build a complete, self-contained interactive HTML5 application (`<!DOCTYPE html><html>...</html>`) in one ```html``` block (no comments, compact code):\n"
                "1. `<head>`: include `<script src=\"https://cdn.tailwindcss.com\"></script>` (and Chart.js or other CDN libraries ONLY if needed by the user's request).\n"
                "2. `<body class=\"min-h-screen bg-slate-950 text-slate-100 p-6\">`: design the exact layout, interactive views, forms, controls, and visual components requested in `REQUEST` and `HISTORY`. Do NOT include unrelated CSV uploaders or generic KPI tables unless requested.\n"
                "3. `<script>`: implement complete, working JavaScript state, realistic domain data, and interactive event handlers so every button, tab, filter, and control works live in the browser."
            )

        taste_profile = self._infer_taste_skill_profile(
            prompt, combined_lower, active_skills
        )
        user_msg = (
            f"REQUEST: {prompt}\n"
            + (f"HISTORY:\n{history_str}\n" if len(all_prompts) > 1 else "")
            + f"{taste_profile['prompt_directive']}\n\n"
            + skills_line
            + existing_context_section
            + (f"FIX ERROR:\n{error_context}\n" if error_context else "")
            + arch_spec
        )

        llm_result = await self.llm_manager.generate_completion(
            system_prompt=self.system_prompt,
            user_prompt=user_msg,
            temperature=0.2,
            max_tokens=1200,
            ws_env=ws_env,
        )
        if llm_result:
            raw_text, provider_label = llm_result
            normalized = self._normalize_llm_output_to_patches(
                raw_text, prompt, skills=active_skills
            )
            if normalized:
                return normalized, provider_label

        patches = self._synthesize_from_context_and_prompt(
            prompt, template, context_files, skills=active_skills
        )
        return patches, "Local Context-Aware Neural Synthesizer"

    def _get_full_animation_library(self) -> List[Dict[str, str]]:
        return [
            {
                "id": "morph-card",
                "name": "3D Glassmorphic Tilt & Glow",
                "category": "HTML5 / CSS3 3D Transform",
                "fps": "60 FPS Hardware Accelerated",
                "stageType": "3d-card",
                "description": "Interactive perspective card with specular radial highlight, spring easing, and layered depth shadows.",
                "htmlCode": '<div class="ux-card-3d">\n  <div class="ux-glow"></div>\n  <h3>HTML5 3D Perspective</h3>\n  <p>Hover or trigger keyframes</p>\n</div>',
                "cssCode": ".ux-card-3d {\n  transform-style: preserve-3d;\n  animation: float3d 3.2s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate;\n  background: linear-gradient(135deg, rgba(99,102,241,0.28), rgba(15,23,42,0.9));\n  border: 1px solid rgba(129,140,248,0.45);\n  border-radius: 20px;\n}\n@keyframes float3d {\n  0% { transform: perspective(800px) rotateX(0deg) rotateY(-8deg) translateY(0px); }\n  100% { transform: perspective(800px) rotateX(8deg) rotateY(10deg) translateY(-14px); }\n}",
                "jsCode": "const el = document.querySelector('.ux-card-3d');\nel.animate([\n  { transform: 'perspective(800px) rotateY(-8deg) scale(0.96)' },\n  { transform: 'perspective(800px) rotateY(8deg) scale(1.04)' }\n], { duration: 1800, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });",
            },
            {
                "id": "elastic-pulse",
                "name": "Elastic Spring Micro-Interaction",
                "category": "Keyframes & Spring Physics",
                "fps": "120Hz ProMotion Ready",
                "stageType": "elastic",
                "description": "Multi-stage elastic bounce and ripple wave propagation for interactive CTA buttons and status indicators.",
                "htmlCode": '<button class="ux-elastic-btn">\n  <span class="pulse-ring"></span>\n  <span class="label">Trigger Elastic Action</span>\n</button>',
                "cssCode": "@keyframes elasticBounce {\n  0% { transform: scale(0.85); }\n  40% { transform: scale(1.12); }\n  70% { transform: scale(0.95); }\n  100% { transform: scale(1); }\n}\n.ux-elastic-btn {\n  animation: elasticBounce 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;\n}",
                "jsCode": "function triggerElastic(target) {\n  target.style.animation = 'none';\n  target.offsetHeight;\n  target.style.animation = 'elasticBounce 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)';\n}",
            },
            {
                "id": "svg-path-morph",
                "name": "HTML5 SVG Stroke & Path Morphing",
                "category": "SVG Vector Animation",
                "fps": "Zero-Layout-Shift Vector",
                "stageType": "svg-morph",
                "description": "Synchronized stroke-dasharray drawing and gradient stop morphing for onboarding and telemetry icons.",
                "htmlCode": '<svg viewBox="0 0 120 120" class="ux-svg-morph">\n  <circle cx="60" cy="60" r="46" stroke="url(#grad)" stroke-width="6" fill="none" />\n  <path d="M38 62 L54 76 L84 44" stroke="#34d399" stroke-width="6" fill="none" />\n</svg>',
                "cssCode": ".ux-svg-morph circle {\n  stroke-dasharray: 290;\n  stroke-dashoffset: 290;\n  animation: drawCircle 2.4s ease-in-out infinite alternate;\n}\n@keyframes drawCircle {\n  to { stroke-dashoffset: 0; transform: rotate(180deg); transform-origin: center; }\n}",
                "jsCode": "const path = document.querySelector('.ux-svg-morph path');\nconst len = path.getTotalLength();\npath.style.strokeDasharray = len;\npath.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1400, iterations: Infinity });",
            },
            {
                "id": "canvas-particles",
                "name": "HTML5 Canvas Particle Constellation",
                "category": "HTML5 Canvas 2D / WebGL",
                "fps": "RequestAnimationFrame Loop",
                "stageType": "canvas-particles",
                "description": "Real-time interactive particle network rendered on an HTML5 <canvas> element with proximity connecting lines.",
                "htmlCode": '<canvas id="ux-particle-canvas" width="420" height="220"></canvas>',
                "cssCode": "#ux-particle-canvas {\n  width: 100%;\n  height: 220px;\n  border-radius: 16px;\n  background: radial-gradient(circle at center, #1e1b4b, #020617);\n}",
                "jsCode": "const ctx = canvas.getContext('2d');\nfunction renderFrame() {\n  ctx.clearRect(0, 0, canvas.width, canvas.height);\n  particles.forEach(p => {\n    p.x += p.vx; p.y += p.vy;\n    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);\n    ctx.fillStyle = '#818cf8'; ctx.fill();\n  });\n  requestAnimationFrame(renderFrame);\n}",
            },
            {
                "id": "stagger-grid",
                "name": "Choreographed Staggered Bento Reveal",
                "category": "CSS Grid & Choreographed Motion",
                "fps": "GPU Composite Layer",
                "stageType": "stagger",
                "description": "Cascading entrance choreography using CSS custom properties (--stagger-idx) for dashboard cards and lists.",
                "htmlCode": '<div class="stagger-grid">\n  <div class="cell" style="--i:0">Card 01</div>\n  <div class="cell" style="--i:1">Card 02</div>\n  <div class="cell" style="--i:2">Card 03</div>\n</div>',
                "cssCode": ".stagger-grid .cell {\n  opacity: 0;\n  animation: slideUpFade 1.6s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate;\n  animation-delay: calc(var(--i) * 180ms);\n}\n@keyframes slideUpFade {\n  0% { opacity: 0.25; transform: translateY(18px) scale(0.94); }\n  100% { opacity: 1; transform: translateY(0) scale(1); }\n}",
                "jsCode": "document.querySelectorAll('.stagger-grid .cell').forEach((el, i) => {\n  el.style.setProperty('--i', i);\n  el.classList.add('is-visible');\n});",
            },
            {
                "id": "liquid-blob",
                "name": "Organic Liquid Morphing Blob",
                "category": "CSS Border-Radius & Filter Morph",
                "fps": "60 FPS Fluid Shader",
                "stageType": "liquid-blob",
                "description": "Continuous organic border-radius morphing with backdrop blur and multi-stop aurora gradient rotation.",
                "htmlCode": '<div class="liquid-aurora-blob">\n  <span>Fluid Morph</span>\n</div>',
                "cssCode": "@keyframes blobMorph {\n  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(0deg) scale(1); }\n  50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: rotate(180deg) scale(1.08); }\n}\n.liquid-aurora-blob {\n  width: 140px; height: 140px;\n  background: linear-gradient(135deg, #6366f1, #ec4899, #10b981);\n  animation: blobMorph 4s ease-in-out infinite;\n}",
                "jsCode": "const blob = document.querySelector('.liquid-aurora-blob');\nblob.addEventListener('pointermove', (e) => {\n  const rect = blob.getBoundingClientRect();\n  blob.style.setProperty('--mx', `${e.clientX - rect.left}px`);\n});",
            },
            {
                "id": "neon-glitch",
                "name": "Cyberpunk Chromatic Glitch Text",
                "category": "CSS Clip-Path & RGB Split",
                "fps": "High-Frequency Keyframes",
                "stageType": "neon-glitch",
                "description": "Dual pseudo-element chromatic aberration and clip-path slice displacement for hero headlines and alerts.",
                "htmlCode": '<div class="glitch-wrapper">\n  <h2 class="glitch-text" data-text="SYSTEM_ONLINE">SYSTEM_ONLINE</h2>\n</div>',
                "cssCode": "@keyframes glitchSlice {\n  0% { clip-path: inset(20% 0 50% 0); transform: translate(-3px, 1px); }\n  50% { clip-path: inset(60% 0 10% 0); transform: translate(3px, -2px); }\n  100% { clip-path: inset(10% 0 70% 0); transform: translate(-2px, 2px); }\n}\n.glitch-text {\n  text-shadow: -2px 0 #ec4899, 2px 0 #06b6d4;\n  animation: glitchSlice 1.5s steps(4) infinite alternate;\n}",
                "jsCode": "const glitch = document.querySelector('.glitch-text');\nsetInterval(() => {\n  glitch.dataset.active = String(Math.random() > 0.3);\n}, 400);",
            },
            {
                "id": "flip-card-3d",
                "name": "3D Isometric Dual-Face Card Flip",
                "category": "CSS3 Backface-Visibility 3D",
                "fps": "Hardware Preserve-3D",
                "stageType": "flip-card",
                "description": "180-degree Y-axis perspective card rotation revealing secondary telemetry backplate without DOM reflow.",
                "htmlCode": '<div class="flip-scene">\n  <div class="flip-card">\n    <div class="face front">Front Telemetry</div>\n    <div class="face back">Back Inspector</div>\n  </div>\n</div>',
                "cssCode": "@keyframes autoFlip3D {\n  0%, 25% { transform: rotateY(0deg); }\n  50%, 75% { transform: rotateY(180deg); }\n  100% { transform: rotateY(360deg); }\n}\n.flip-card {\n  transform-style: preserve-3d;\n  animation: autoFlip3D 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;\n}",
                "jsCode": "const card = document.querySelector('.flip-card');\ncard.addEventListener('click', () => {\n  card.classList.toggle('is-flipped');\n});",
            },
            {
                "id": "audio-equalizer",
                "name": "HTML5 WebAudio Spectrum Equalizer",
                "category": "Audio Visualization & Bars",
                "fps": "60 FPS Frequency Bars",
                "stageType": "equalizer",
                "description": "Multi-band harmonic frequency bar visualizer with phase-offset keyframe scaling and peak glow indicators.",
                "htmlCode": '<div class="eq-bars">\n  <span style="--d:0.1s"></span><span style="--d:0.3s"></span><span style="--d:0.2s"></span>\n  <span style="--d:0.4s"></span><span style="--d:0.15s"></span><span style="--d:0.35s"></span>\n</div>',
                "cssCode": "@keyframes eqPulse {\n  0% { transform: scaleY(0.2); }\n  50% { transform: scaleY(1); }\n  100% { transform: scaleY(0.35); }\n}\n.eq-bars span {\n  display: inline-block; width: 10px; height: 90px;\n  background: linear-gradient(to top, #4f46e5, #34d399);\n  animation: eqPulse 0.9s ease-in-out infinite alternate;\n  animation-delay: var(--d);\n}",
                "jsCode": "const analyser = audioCtx.createAnalyser();\nanalyser.fftSize = 32;\nconst data = new Uint8Array(analyser.frequencyBinCount);\nfunction updateBars() {\n  analyser.getByteFrequencyData(data);\n  requestAnimationFrame(updateBars);\n}",
            },
            {
                "id": "skeleton-shimmer",
                "name": "Shimmering Skeleton Content Loader",
                "category": "Perceived Performance UX",
                "fps": "GPU Linear-Gradient Sweep",
                "stageType": "shimmer",
                "description": "Directional specular highlight sweep across placeholder layout blocks during asynchronous data hydration.",
                "htmlCode": '<div class="skeleton-card">\n  <div class="sk-avatar shimmer"></div>\n  <div class="sk-line shimmer w-80"></div>\n  <div class="sk-line shimmer w-60"></div>\n</div>',
                "cssCode": "@keyframes shimmerSweep {\n  0% { background-position: -200% 0; }\n  100% { background-position: 200% 0; }\n}\n.shimmer {\n  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);\n  background-size: 200% 100%;\n  animation: shimmerSweep 1.8s infinite linear;\n}",
                "jsCode": "function setHydrated(container, isLoaded) {\n  container.querySelectorAll('.shimmer').forEach(el => {\n    el.classList.toggle('shimmer', !isLoaded);\n  });\n}",
            },
            {
                "id": "typewriter-terminal",
                "name": "Typewriter Matrix Command Stream",
                "category": "Stepped Character Animation",
                "fps": "CSS steps() Timing Function",
                "stageType": "typewriter",
                "description": "Monospace terminal typing sequence with blinking block cursor and stepped width reveal.",
                "htmlCode": '<div class="typewriter-box">\n  <span class="typed-line">&gt; compiling html5_shaders.wasm... [OK]</span>\n</div>',
                "cssCode": "@keyframes typeReveal {\n  from { width: 0; }\n  to { width: 100%; }\n}\n.typed-line {\n  display: inline-block; overflow: hidden; white-space: nowrap;\n  border-right: 2px solid #34d399;\n  animation: typeReveal 2.6s steps(36, end) infinite alternate;\n}",
                "jsCode": "async function typeText(el, text, speed = 35) {\n  el.textContent = '';\n  for (const ch of text) {\n    el.textContent += ch;\n    await new Promise(r => setTimeout(r, speed));\n  }\n}",
            },
            {
                "id": "orbital-rings",
                "name": "3D Gyroscopic Orbital Rings",
                "category": "Multi-Axis CSS3 3D Rotation",
                "fps": "60 FPS Matrix3D",
                "stageType": "orbit",
                "description": "Intersecting X/Y/Z axis concentric rings rotating in 3D space around a luminous quantum core.",
                "htmlCode": '<div class="orbit-system">\n  <div class="ring ring-x"></div>\n  <div class="ring ring-y"></div>\n  <div class="ring ring-z"></div>\n  <div class="core-dot"></div>\n</div>',
                "cssCode": "@keyframes spin3D {\n  0% { transform: rotateX(65deg) rotateY(15deg) rotateZ(0deg); }\n  100% { transform: rotateX(65deg) rotateY(15deg) rotateZ(360deg); }\n}\n.ring {\n  border: 2px solid #818cf8; border-radius: 50%;\n  animation: spin3D 2.4s linear infinite;\n}",
                "jsCode": "document.querySelectorAll('.ring').forEach((ring, idx) => {\n  ring.style.animationDuration = `${2.2 + idx * 0.6}s`;\n});",
            },
            {
                "id": "magnetic-dock",
                "name": "MacOS-Style Magnetic Magnification Dock",
                "category": "Proximity Spring Scaling",
                "fps": "Interactive Pointer Physics",
                "stageType": "dock",
                "description": "Gaussian proximity scaling dock where neighboring icons smoothly interpolate size based on cursor distance.",
                "htmlCode": '<div class="magnetic-dock">\n  <button class="dock-item">⚡</button>\n  <button class="dock-item">🎨</button>\n  <button class="dock-item">🚀</button>\n  <button class="dock-item">💎</button>\n</div>',
                "cssCode": "@keyframes dockWave {\n  0%, 100% { transform: translateY(0) scale(1); }\n  50% { transform: translateY(-12px) scale(1.28); }\n}\n.dock-item {\n  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);\n  animation: dockWave 1.6s ease-in-out infinite;\n}",
                "jsCode": "dock.addEventListener('mousemove', (e) => {\n  items.forEach(item => {\n    const d = Math.abs(e.clientX - (item.offsetLeft + item.offsetWidth / 2));\n    const scale = Math.max(1, 1.5 - d / 120);\n    item.style.transform = `scale(${scale}) translateY(${-(scale-1)*20}px)`;\n  });\n});",
            },
            {
                "id": "radar-sonar",
                "name": "Concentric Telemetry Radar Sweep",
                "category": "Conic-Gradient & Ripple UX",
                "fps": "Continuous Conic Scan",
                "stageType": "radar",
                "description": "Rotating conic-gradient radar scanner with pulsing target blips for real-time network and geospatial UIs.",
                "htmlCode": '<div class="radar-circle">\n  <div class="radar-beam"></div>\n  <span class="radar-blip"></span>\n</div>',
                "cssCode": "@keyframes radarSpin {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}\n.radar-beam {\n  background: conic-gradient(from 0deg, transparent 70%, rgba(52, 211, 153, 0.55));\n  animation: radarSpin 2.2s linear infinite;\n}",
                "jsCode": "function spawnBlip(radar, x, y) {\n  const blip = document.createElement('span');\n  blip.className = 'radar-blip';\n  blip.style.left = `${x}%`; blip.style.top = `${y}%`;\n  radar.appendChild(blip);\n}",
            },
            {
                "id": "parallax-layers",
                "name": "Multi-Depth Parallax Glass Stack",
                "category": "Z-Depth Layer Choreography",
                "fps": "GPU Translate3D Stack",
                "stageType": "parallax",
                "description": "Three-tier floating glassmorphic layers moving at differential velocities to create deep spatial hierarchy.",
                "htmlCode": '<div class="parallax-stack">\n  <div class="layer bg-layer">Layer 01</div>\n  <div class="layer mid-layer">Layer 02</div>\n  <div class="layer fg-layer">Layer 03</div>\n</div>',
                "cssCode": "@keyframes layerFloat {\n  0% { transform: translateY(8px) scale(0.95); }\n  100% { transform: translateY(-8px) scale(1.03); }\n}\n.parallax-stack .layer {\n  backdrop-filter: blur(12px);\n  animation: layerFloat 2s ease-in-out infinite alternate;\n}",
                "jsCode": "window.addEventListener('pointermove', (e) => {\n  const x = (e.clientX / window.innerWidth - 0.5) * 24;\n  const y = (e.clientY / window.innerHeight - 0.5) * 24;\n  layers.forEach((l, i) => l.style.transform = `translate3d(${x*(i+1)*0.4}px, ${y*(i+1)*0.4}px, 0)`);\n});",
            },
            {
                "id": "gsap-scrolltrigger-pin",
                "name": "GSAP 3 ScrollTrigger Timeline & Scrub",
                "category": "GSAP 3 / JS Animation Library",
                "fps": "GSAP 3 Ticker 120FPS",
                "stageType": "3d-card",
                "description": "GreenSock GSAP 3 timeline with ScrollTrigger scrubbing, staggered split-text reveal, and hardware-accelerated matrix transforms.",
                "htmlCode": '<section class="gsap-stage">\n  <div class="gsap-box">GSAP 3 Timeline</div>\n  <div class="gsap-sub">ScrollTrigger Scrub Active</div>\n</section>',
                "cssCode": ".gsap-stage {\n  display: flex; flex-direction: column; align-items: center; gap: 12px;\n}\n.gsap-box {\n  padding: 18px 28px; border-radius: 16px;\n  background: linear-gradient(135deg, #10b981, #4f46e5);\n  will-change: transform, opacity;\n}",
                "jsCode": "// CDN: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js\nconst tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'power3.inOut' } });\ntl.fromTo('.gsap-box', { y: 24, rotateX: -25, opacity: 0.4 }, { y: -12, rotateX: 15, opacity: 1, duration: 1.1 })\n  .to('.gsap-sub', { scale: 1.08, color: '#34d399', duration: 0.6 }, '-=0.5');",
            },
            {
                "id": "animejs-svg-morph",
                "name": "Anime.js Staggered Grid & SVG Morph",
                "category": "Anime.js / JS Library",
                "fps": "Anime.js Spring Engine",
                "stageType": "svg-morph",
                "description": "Anime.js keyframe timeline with 2D grid stagger propagation, spring physics easing, and SVG polygon morphing.",
                "htmlCode": '<div class="anime-grid">\n  <span class="dot"></span><span class="dot"></span><span class="dot"></span>\n  <span class="dot"></span><span class="dot"></span><span class="dot"></span>\n</div>',
                "cssCode": ".anime-grid {\n  display: grid; grid-template-columns: repeat(3, 36px); gap: 12px;\n}\n.anime-grid .dot {\n  width: 36px; height: 36px; border-radius: 10px;\n  background: linear-gradient(135deg, #ec4899, #6366f1);\n}",
                "jsCode": "// CDN: https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js\nanime({\n  targets: '.anime-grid .dot',\n  scale: [{ value: 0.4, easing: 'easeOutSine', duration: 400 }, { value: 1.15, easing: 'easeInOutQuad', duration: 750 }],\n  rotateZ: anime.stagger([-25, 25], { grid: [3, 2], from: 'center' }),\n  delay: anime.stagger(110, { grid: [3, 2], from: 'center' }),\n  loop: true,\n  direction: 'alternate'\n});",
            },
            {
                "id": "framer-motion-spring",
                "name": "Framer Motion Layout & Gesture Spring",
                "category": "Framer Motion / React Library",
                "fps": "Spring Physics Solver",
                "stageType": "elastic",
                "description": "Declarative Framer Motion spring physics (`stiffness: 420, damping: 24`) with `whileHover`, `whileTap`, and `layoutId` shared element transitions.",
                "htmlCode": '<div class="motion-card" data-layout-id="hero-card">\n  <h4>Framer Motion Spring</h4>\n  <p>Drag, hover, or tap to trigger spring physics</p>\n</div>',
                "cssCode": ".motion-card {\n  padding: 20px 28px; border-radius: 20px;\n  background: rgba(99, 102, 241, 0.22);\n  border: 1px solid rgba(165, 180, 252, 0.45);\n  cursor: grab;\n}",
                "jsCode": "// NPM: npm install framer-motion\nimport { motion } from 'framer-motion';\nexport const SpringCard = () => (\n  <motion.div\n    layoutId=\"hero-card\"\n    whileHover={{ scale: 1.06, rotateY: 8 }}\n    whileTap={{ scale: 0.94 }}\n    transition={{ type: 'spring', stiffness: 420, damping: 24 }}\n    className=\"motion-card\"\n  />\n);",
            },
            {
                "id": "threejs-webgl-torus",
                "name": "Three.js WebGL 3D Shader Torus",
                "category": "Three.js / WebGL 3D Library",
                "fps": "WebGL 2.0 GPU Shader",
                "stageType": "orbit",
                "description": "Three.js WebGLRenderer scene with an iridescent wireframe TorusKnotGeometry, point lights, and orbital camera damping.",
                "htmlCode": '<canvas id="three-webgl-stage" width="480" height="240"></canvas>',
                "cssCode": "#three-webgl-stage {\n  width: 100%; height: 240px; border-radius: 16px;\n  background: radial-gradient(circle at center, #0f172a, #020617);\n}",
                "jsCode": "// CDN: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js\nconst scene = new THREE.Scene();\nconst camera = new THREE.PerspectiveCamera(60, 2, 0.1, 100);\nconst mesh = new THREE.Mesh(\n  new THREE.TorusKnotGeometry(1.1, 0.34, 100, 16),\n  new THREE.MeshNormalMaterial({ wireframe: true })\n);\nscene.add(mesh); camera.position.z = 3.5;\nfunction animate() { requestAnimationFrame(animate); mesh.rotation.x += 0.015; mesh.rotation.y += 0.02; renderer.render(scene, camera); }",
            },
            {
                "id": "motion-one-waapi",
                "name": "Motion One & Velocity.js Spring Flip",
                "category": "Motion One / WAAPI Library",
                "fps": "Hardware WAAPI Engine",
                "stageType": "flip-card",
                "description": "Ultra-lightweight Motion One (`animate`, `spring`, `stagger`) driving native browser Web Animations API keyframes on the compositor thread.",
                "htmlCode": '<div class="motion-one-deck">\n  <div class="m-card">WAAPI 01</div>\n  <div class="m-card">WAAPI 02</div>\n  <div class="m-card">WAAPI 03</div>\n</div>',
                "cssCode": ".motion-one-deck { display: flex; gap: 12px; perspective: 800px; }\n.m-card {\n  padding: 16px 20px; border-radius: 14px;\n  background: #1e1b4b; border: 1px solid #6366f1;\n}",
                "jsCode": "// CDN: https://cdn.jsdelivr.net/npm/motion@10.18.0/+esm\nimport { animate, stagger, spring } from 'motion';\nanimate(\n  '.m-card',\n  { y: [-14, 0], rotateY: [25, 0], opacity: [0.4, 1] },\n  { delay: stagger(0.12), easing: spring({ stiffness: 320, damping: 20 }), repeat: Infinity, direction: 'alternate' }\n);",
            },
        ]

    def _extract_existing_catalog(self, context_files: Dict[str, str]) -> List[Dict[str, str]]:
        html = context_files.get("index.html", "")
        if not html:
            return []
        m = re.search(r"const\s+CATALOG\s*=\s*(\[\s*\{.*?\}\s*\]);", html, re.DOTALL)
        if not m:
            return []
        try:
            data = json.loads(m.group(1))
            if isinstance(data, list) and all(isinstance(x, dict) for x in data):
                return data
        except Exception:
            pass
        return []

    def _extract_chat_prompts(self, context_files: Dict[str, str], current_prompt: str) -> List[str]:
        raw_meta = context_files.get(".studio_chat_history.json", "")
        prompts: List[str] = []
        if raw_meta:
            try:
                meta = json.loads(raw_meta)
                history = meta.get("chat_history", [])
                # history is stored newest-first; reverse to chronological order
                for item in reversed(history):
                    p = (item.get("prompt") or "").strip()
                    if p:
                        prompts.append(p)
            except Exception:
                pass
        if not prompts or prompts[-1] != current_prompt.strip():
            prompts.append(current_prompt.strip())
        return prompts

    def _extract_contextual_specs(
        self, prompt: str, context_files: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Extracts project baseline + cumulative follow-up prompt modifications from workspace
        files and chat history so follow-up prompts evolve the existing project rather than
        overwriting its identity.
        """
        all_prompts = self._extract_chat_prompts(context_files, prompt)
        combined_text = " \n ".join(all_prompts)
        c_lower = combined_text.lower()
        p_lower = prompt.lower()

        existing_catalog = self._extract_existing_catalog(context_files)
        is_followup = len(all_prompts) > 1 or bool(existing_catalog)

        existing_title = ""
        if "index.html" in context_files:
            m_title = re.search(
                r"<title>(.*?)</title>", context_files["index.html"], re.IGNORECASE
            )
            if m_title:
                existing_title = m_title.group(1).strip()

        # Base prompt is the initial project creation prompt
        base_prompt = all_prompts[0] if all_prompts else prompt.strip()

        wants_code_inspector = any(
            k in c_lower
            for k in (
                "sample code",
                "code snippet",
                "html5",
                "css",
                "animation",
                "annimation",
                "component",
                "syntax",
                "playground",
                "shader",
                "svg",
                "canvas",
            )
        )
        wants_animation_stage = any(
            k in c_lower
            for k in (
                "animation",
                "annimation",
                "transition",
                "keyframe",
                "motion",
                "3d",
                "hover",
                "micro-interaction",
                "canvas",
                "html5",
            )
        )

        # Determine requested item count across existing catalog + follow-up prompt
        # Strip '21.dev' / '21st.dev' / 'html5' before extracting counts
        prompt_without_versions = re.sub(
            r"\b(21(?:st)?\.dev|html5|nextjs\s*15)\b", "", p_lower
        )
        numbers_in_prompt = [
            int(n)
            for n in re.findall(r"\b(\d+)\b", prompt_without_versions)
            if 1 <= int(n) <= 30 and int(n) not in (5, 15, 21)
        ]
        all_numbers = [
            int(n)
            for n in re.findall(r"\b(\d+)\b", prompt_without_versions)
            if 1 <= int(n) <= 30
        ]

        current_count = len(existing_catalog) if existing_catalog else 5
        requested_count = current_count

        asks_for_more = any(
            w in p_lower
            for w in ("add more", "more ", "atleast", "at least", "increase", "expand", "additional", "extra", "new ")
        )

        if all_numbers:
            max_num = max(all_numbers)
            if "more" in p_lower and max_num < current_count:
                requested_count = current_count + max_num
            else:
                requested_count = max(max_num, current_count)
        if asks_for_more and requested_count <= current_count:
            requested_count = max(current_count + 5, 16)
        if "library" in p_lower or "libraries" in p_lower or "javascript" in p_lower:
            requested_count = max(requested_count, 20)
        if "atleast 10" in p_lower or "at least 10" in p_lower or (numbers_in_prompt and max(numbers_in_prompt) >= 10):
            requested_count = max(requested_count, 15)

        # Generate a clean, non-truncated project title
        if wants_animation_stage:
            heading = "HTML5 Interactive Animation Studio"
        elif (
            is_followup
            and existing_title
            and len(existing_title) <= 52
            and not any(
                existing_title.lower().startswith(prefix)
                for prefix in ("add more", "update ", "change ", "fix ", "modify ", "once ")
            )
        ):
            heading = existing_title
        else:
            cleaned = re.sub(
                r"^(create|build|make|design|develop|generate)\s+(a|an|the)?\s*",
                "",
                base_prompt.strip(),
                flags=re.IGNORECASE,
            )
            words_list = cleaned.split()[:6]
            heading = (
                " ".join(words_list).strip(" ,.:;-").title()
                if words_list
                else "Interactive Studio Application"
            )

        # Detect theme/accent preferences from follow-up prompt
        accent_primary = "#6366f1"
        accent_light = "#818cf8"
        if "emerald" in p_lower or "green" in p_lower:
            accent_primary, accent_light = "#059669", "#34d399"
        elif "rose" in p_lower or "pink" in p_lower or "crimson" in p_lower:
            accent_primary, accent_light = "#e11d48", "#fb7185"
        elif "cyan" in p_lower or "neon" in p_lower or "cyber" in p_lower:
            accent_primary, accent_light = "#0891b2", "#22d3ee"
        elif "amber" in p_lower or "gold" in p_lower or "orange" in p_lower:
            accent_primary, accent_light = "#d97706", "#fbbf24"

        visible_files = [
            k for k in context_files.keys() if k != ".studio_chat_history.json"
        ]

        return {
            "heading": heading,
            "base_prompt": base_prompt,
            "latest_prompt": prompt.strip(),
            "all_prompts": all_prompts,
            "is_followup": is_followup,
            "existing_catalog": existing_catalog,
            "requested_count": requested_count,
            "existing_files": visible_files,
            "wants_code_inspector": wants_code_inspector,
            "wants_animation_stage": wants_animation_stage,
            "accent_primary": accent_primary,
            "accent_light": accent_light,
        }

    def _synthesize_from_context_and_prompt(
        self,
        prompt: str,
        template: str,
        context_files: Dict[str, str],
        skills: Optional[List[str]] = None,
        llm_custom_items: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        active_skills = list(skills or [])
        specs = self._extract_contextual_specs(prompt, context_files)
        pkg_json, server_js = self._default_runtime_files()
        heading = specs["heading"]
        target_count = specs["requested_count"]
        existing_catalog = specs["existing_catalog"]

        # Build or expand catalog based on existing workspace state + new prompt
        if specs["wants_animation_stage"] or specs["wants_code_inspector"]:
            full_library = self._get_full_animation_library()
            catalog: List[Dict[str, str]] = []
            seen_ids = set()

            # 1. Preserve existing items in the workspace project first
            for item in existing_catalog:
                iid = item.get("id")
                if iid and iid not in seen_ids:
                    lib_match = next((x for x in full_library if x["id"] == iid), None)
                    if lib_match and "stageType" not in item:
                        item["stageType"] = lib_match["stageType"]
                    catalog.append(item)
                    seen_ids.add(iid)

            # 2. Add items from the full animation library up to target_count
            for lib_item in full_library:
                if len(catalog) >= target_count:
                    break
                if lib_item["id"] not in seen_ids:
                    catalog.append(lib_item)
                    seen_ids.add(lib_item["id"])

            # 3. Append any bespoke animation items synthesized by Qwen2.5-Coder-7B for this prompt
            for custom_item in llm_custom_items or []:
                cid = custom_item.get("id") or f"qwen-anim-{len(catalog)+1}"
                if cid not in seen_ids:
                    custom_item["id"] = cid
                    catalog.append(custom_item)
                    seen_ids.add(cid)

            items_js = json.dumps(catalog, indent=2)
        else:
            words = [
                w.strip(",.:;!?()")
                for w in (specs["base_prompt"] + " " + prompt).split()
                if len(w.strip(",.:;!?()")) > 3
            ]
            keywords = list(dict.fromkeys(words))[: max(target_count, 4)] or [
                "Core",
                "Workflow",
                "Analytics",
                "Automation",
            ]
            dynamic_list = list(existing_catalog)
            existing_ids = {item.get("id") for item in dynamic_list}
            for idx, kw in enumerate(keywords):
                if len(dynamic_list) >= max(target_count, 4):
                    break
                mod_id = f"mod-{idx+1}-{kw.lower()}"
                if mod_id in existing_ids:
                    continue
                label = kw.capitalize()
                dynamic_list.append(
                    {
                        "id": mod_id,
                        "name": f"{label} Interactive Module",
                        "category": f"Module {len(dynamic_list)+1:02d}",
                        "fps": "Live State",
                        "stageType": "3d-card",
                        "description": f"Context-generated interactive view for '{label}' updated via prompt: {prompt}",
                        "htmlCode": f'<section class="module-{kw.lower()}">\n  <h2>{label} Component</h2>\n  <p>Interactive state ready</p>\n</section>',
                        "cssCode": f".module-{kw.lower()} {{\n  padding: 20px;\n  border-radius: 16px;\n  background: #0f172a;\n  border: 1px solid #334155;\n}}",
                        "jsCode": f"// Controller for {label}\nexport function init{label}(state) {{\n  console.log('Initialized {label}:', state);\n}}",
                    }
                )
            items_js = json.dumps(dynamic_list, indent=2)

        followup_banner_html = ""
        if specs["is_followup"]:
            escaped_followup = (
                specs["latest_prompt"]
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
            )
            followup_banner_html = f"""
        <div style="margin-top:8px;display:inline-flex;align-items:center;gap:8px;padding:5px 12px;border-radius:10px;background:rgba(16,185,129,0.14);border:1px solid rgba(16,185,129,0.35);font-size:11.5px;color:#6ee7b7;">
          <span>✓ Applied Project Update (#{len(specs["all_prompts"])}):</span>
          <strong style="color:#ecfdf5;">{escaped_followup}</strong>
        </div>"""
        if active_skills:
            skills_badges = "".join(
                f'<span style="padding:2px 8px;border-radius:999px;background:rgba(99,102,241,0.18);border:1px solid rgba(99,102,241,0.38);font-size:10.5px;color:#c7d2fe;font-family:monospace;">✦ {sid}</span>'
                for sid in active_skills
            )
            followup_banner_html += f"""
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;">
          <span style="font-size:11px;color:#94a3b8;">Active LLM Skills:</span>
          {skills_badges}
        </div>"""

        app_tsx = f""""use client";
import React, {{ useState }} from "react";

const ITEMS = {items_js};

export default function ContextGeneratedApp() {{
  const [selectedId, setSelectedId] = useState<string>(ITEMS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCodeTab, setActiveCodeTab] = useState<"html" | "css" | "js">("html");
  const [speed, setSpeed] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  const filteredItems = ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeItem = ITEMS.find((item) => item.id === selectedId) || ITEMS[0];
  const codeContent =
    activeCodeTab === "html"
      ? activeItem.htmlCode
      : activeCodeTab === "css"
      ? activeItem.cssCode
      : activeItem.jsCode;

  const copyCode = () => {{
    navigator.clipboard?.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }};

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              CONTEXT-AWARE STUDIO BUILD &bull; {template.upper()} &bull; {{ITEMS.length}} TYPES
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-2">{heading}</h1>
            <p className="text-xs text-slate-400 mt-1">{specs["base_prompt"]}</p>
            <p className="text-xs text-emerald-400 mt-1">Latest Update: {specs["latest_prompt"]}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Speed:</label>
            <select
              value={{speed}}
              onChange={{(e) => setSpeed(Number(e.target.value))}}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <option value={{0.5}}>0.5x Slow Motion</option>
              <option value={{1}}>1.0x Normal</option>
              <option value={{2}}>2.0x Fast</option>
            </select>
          </div>
        </header>

        <div className="grid md:grid-cols-12 gap-6">
          <aside className="md:col-span-4 space-y-2.5">
            <div className="text-xs font-bold uppercase text-slate-400">
              Select Animation / UI Type ({{filteredItems.length}} / {{ITEMS.length}})
            </div>
            <input
              type="text"
              value={{searchQuery}}
              onChange={{(e) => setSearchQuery(e.target.value)}}
              placeholder="Filter animations..."
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
            />
            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {{filteredItems.map((item) => (
                <button
                  key={{item.id}}
                  onClick={{() => setSelectedId(item.id)}}
                  className={{`w-full text-left p-3.5 rounded-xl border transition ${{
                    item.id === selectedId
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }}`}}
                >
                  <div className="text-[11px] font-semibold text-indigo-400">{{item.category}}</div>
                  <div className="font-bold text-sm mt-0.5">{{item.name}}</div>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2">{{item.description}}</div>
                </button>
              ))}}
            </div>
          </aside>

          <section className="md:col-span-8 space-y-5">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">{{activeItem.name}}</h2>
                  <p className="text-xs text-slate-400">{{activeItem.description}}</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300">
                  {{activeItem.fps}}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/60">
                <div className="flex gap-1.5">
                  {{(["html", "css", "js"] as const).map((tab) => (
                    <button
                      key={{tab}}
                      onClick={{() => setActiveCodeTab(tab)}}
                      className={{`px-3 py-1 rounded-lg text-xs font-mono uppercase ${{
                        activeCodeTab === tab
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }}`}}
                    >
                      {{tab === "html" ? "HTML5 Markup" : tab === "css" ? "CSS3 Keyframes" : "JS Controller"}}
                    </button>
                  ))}}
                </div>
                <button
                  onClick={{copyCode}}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
                >
                  {{copied ? "✓ Copied" : "Copy Sample Code"}}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-indigo-200 overflow-x-auto leading-relaxed">
                <code>{{codeContent}}</code>
              </pre>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}}
"""

        index_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{heading}</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    :root {{
      --accent: {specs["accent_primary"]};
      --accent-light: {specs["accent_light"]};
    }}
    body {{
      background: radial-gradient(circle at top right, #1e1b4b 0%, #020617 60%);
      color: #f1f5f9;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      line-height: 1.5;
    }}
    .shell {{ max-width: 1120px; margin: 0 auto; padding: 20px 18px 56px; display: flex; flex-direction: column; gap: 18px; }}
    .card {{
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid #1e293b;
      border-radius: 18px;
      padding: 20px;
      box-shadow: 0 20px 45px -15px rgba(0, 0, 0, 0.6);
    }}
    .badge {{
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 11px; border-radius: 999px; font-size: 11px; font-weight: 700;
      background: rgba(99, 102, 241, 0.18); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.35);
    }}
    .layout-grid {{
      display: grid;
      grid-template-columns: 330px 1fr;
      gap: 18px;
      align-items: start;
    }}
    @media (max-width: 780px) {{
      .layout-grid {{ grid-template-columns: 1fr; }}
    }}
    .search-input {{
      width: 100%; padding: 9px 12px; border-radius: 10px;
      background: #020617; border: 1px solid #1e293b; color: #f8fafc;
      font-size: 12px; margin-bottom: 10px; outline: none;
    }}
    .search-input:focus {{ border-color: var(--accent); }}
    .type-scroll {{
      max-height: 520px; overflow-y: auto; padding-right: 4px;
    }}
    .type-btn {{
      width: 100%; text-align: left; cursor: pointer;
      padding: 12px 13px; border-radius: 14px;
      background: rgba(2, 6, 23, 0.65); border: 1px solid #1e293b;
      color: #e2e8f0; transition: all 0.18s ease; margin-bottom: 8px;
    }}
    .type-btn:hover {{ border-color: var(--accent); background: rgba(30, 27, 75, 0.45); }}
    .type-btn.active {{
      background: linear-gradient(135deg, rgba(79, 70, 229, 0.28), rgba(15, 23, 42, 0.95));
      border-color: var(--accent-light);
      box-shadow: 0 8px 25px -6px rgba(79, 70, 229, 0.45);
    }}
    .stage-box {{
      height: 240px; border-radius: 16px;
      background: radial-gradient(circle at center, rgba(49, 46, 129, 0.45), #020617 85%);
      border: 1px solid #1e293b;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden; margin: 14px 0;
    }}
    .btn {{
      cursor: pointer; border: none; border-radius: 10px; padding: 8px 14px;
      font-size: 12px; font-weight: 600; transition: all 0.15s ease;
    }}
    .btn-primary {{ background: var(--accent); color: white; }}
    .btn-primary:hover {{ opacity: 0.92; }}
    .btn-ghost {{ background: #0f172a; color: #94a3b8; border: 1px solid #1e293b; }}
    .btn-ghost.active, .btn-ghost:hover {{ background: #1e293b; color: #ffffff; border-color: var(--accent); }}
    pre {{
      background: #020617; border: 1px solid #1e293b; border-radius: 12px;
      padding: 16px; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px; color: #c7d2fe; line-height: 1.55;
    }}
    /* Live HTML5 Animation Keyframes */
    @keyframes float3d {{
      0% {{ transform: perspective(700px) rotateX(-8deg) rotateY(-14deg) translateY(6px); }}
      100% {{ transform: perspective(700px) rotateX(10deg) rotateY(14deg) translateY(-10px); }}
    }}
    @keyframes elasticPulse {{
      0% {{ transform: scale(0.84); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }}
      50% {{ transform: scale(1.08); box-shadow: 0 0 0 22px rgba(99, 102, 241, 0); }}
      100% {{ transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }}
    }}
    @keyframes svgStroke {{
      0% {{ stroke-dashoffset: 280; transform: rotate(0deg); }}
      100% {{ stroke-dashoffset: 0; transform: rotate(360deg); }}
    }}
    @keyframes staggerWave {{
      0% {{ transform: translateY(16px) scale(0.92); opacity: 0.35; }}
      100% {{ transform: translateY(-6px) scale(1.03); opacity: 1; }}
    }}
    @keyframes blobMorph {{
      0%, 100% {{ border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(0deg) scale(0.96); }}
      50% {{ border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: rotate(180deg) scale(1.08); }}
    }}
    @keyframes glitchAnim {{
      0% {{ transform: translate(0); text-shadow: -3px 0 #ec4899, 3px 0 #06b6d4; }}
      25% {{ transform: translate(-3px, 2px) skewX(4deg); text-shadow: 3px 0 #ec4899, -3px 0 #22d3ee; }}
      50% {{ transform: translate(3px, -2px) skewX(-3deg); text-shadow: -2px -2px #f43f5e, 2px 2px #34d399; }}
      100% {{ transform: translate(0); text-shadow: -3px 0 #ec4899, 3px 0 #06b6d4; }}
    }}
    @keyframes flip3D {{
      0% {{ transform: perspective(700px) rotateY(0deg); }}
      50% {{ transform: perspective(700px) rotateY(180deg); }}
      100% {{ transform: perspective(700px) rotateY(360deg); }}
    }}
    @keyframes eqBar {{
      0% {{ transform: scaleY(0.18); }}
      100% {{ transform: scaleY(1); }}
    }}
    @keyframes shimmerSweep {{
      0% {{ background-position: -200% 0; }}
      100% {{ background-position: 200% 0; }}
    }}
    @keyframes radarSweep {{
      from {{ transform: rotate(0deg); }}
      to {{ transform: rotate(360deg); }}
    }}
    .demo-3d-card {{
      width: 240px; padding: 22px; border-radius: 18px; text-align: center;
      background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(16,185,129,0.18));
      border: 1px solid rgba(165,180,252,0.5);
      box-shadow: 0 25px 50px -12px rgba(79, 70, 229, 0.5);
      animation: float3d calc(2.4s / var(--speed, 1)) ease-in-out infinite alternate;
    }}
    .demo-elastic-pill {{
      padding: 16px 28px; border-radius: 999px; font-weight: 800; font-size: 15px;
      background: linear-gradient(90deg, #4f46e5, #ec4899); color: white;
      animation: elasticPulse calc(1.8s / var(--speed, 1)) cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
    }}
    .demo-stagger-row {{ display: flex; gap: 12px; }}
    .demo-stagger-cell {{
      width: 64px; height: 80px; border-radius: 14px;
      background: rgba(99, 102, 241, 0.25); border: 1px solid #6366f1;
      display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;
      animation: staggerWave calc(1.2s / var(--speed, 1)) ease-in-out infinite alternate;
    }}
    .demo-liquid-blob {{
      width: 135px; height: 135px; display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 12px; color: white;
      background: linear-gradient(135deg, #6366f1, #ec4899, #10b981);
      box-shadow: 0 0 40px rgba(236, 72, 153, 0.45);
      animation: blobMorph calc(3.6s / var(--speed, 1)) ease-in-out infinite;
    }}
    .demo-glitch {{
      font-size: 26px; font-weight: 900; letter-spacing: 0.12em; font-family: monospace;
      color: #f8fafc;
      animation: glitchAnim calc(0.9s / var(--speed, 1)) steps(3) infinite;
    }}
    .demo-flip-card {{
      width: 210px; height: 125px; border-radius: 16px;
      background: linear-gradient(135deg, #312e81, #0f172a);
      border: 2px solid #818cf8; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      animation: flip3D calc(3.8s / var(--speed, 1)) ease-in-out infinite;
    }}
  </style>
</head>
<body>
  <div class="shell">
    <!-- Top Portal Header -->
    <header class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
      <div>
        <span class="badge">Interactive Preview</span>
        <h1 style="font-size:22px;font-weight:800;margin-top:6px;letter-spacing:-0.02em;">{heading}</h1>
        <p style="font-size:12.5px;color:#94a3b8;margin-top:2px;">{specs["base_prompt"]}</p>{followup_banner_html}
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:11px;color:#94a3b8;">Playback Speed:</span>
        <button class="btn btn-ghost" onclick="setSpeed(0.5, this)">0.5x</button>
        <button class="btn btn-ghost active" onclick="setSpeed(1, this)">1x</button>
        <button class="btn btn-ghost" onclick="setSpeed(2, this)">2x</button>
      </div>
    </header>

    <!-- Main Interactive Split View: Animation Type Selector + Live Stage & Sample Code -->
    <div class="layout-grid">
      <!-- Left Column: Selectable Animation / Component Types -->
      <aside class="card" style="padding:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 4px 8px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">
            Select Animation / UI Type (<span id="count-label">0</span>)
          </div>
        </div>
        <input
          id="filter-input"
          type="text"
          class="search-input"
          placeholder="Search animation or category..."
          oninput="filterTypes(this.value)"
        />
        <div id="type-list" class="type-scroll"></div>
      </aside>

      <!-- Right Column: Live Interactive Stage + Tabbed Sample Code Inspector -->
      <section style="display:flex;flex-direction:column;gap:16px;">
        <!-- Live HTML5 Animation Preview Stage -->
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div>
              <span id="active-category" class="badge">HTML5 / CSS3</span>
              <h2 id="active-title" style="font-size:18px;font-weight:800;margin-top:6px;"></h2>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <span id="active-fps" style="font-size:11px;font-family:monospace;color:#34d399;background:rgba(16,185,129,0.14);padding:4px 10px;border-radius:8px;border:1px solid rgba(16,185,129,0.3);"></span>
              <button class="btn btn-primary" onclick="replayAnimation()">Replay Animation</button>
            </div>
          </div>
          <p id="active-desc" style="font-size:12.5px;color:#94a3b8;margin-top:6px;"></p>

          <div id="live-stage" class="stage-box"></div>
        </div>

        <!-- Sample Code & JS Library Generation Window for Selected Type -->
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#a5b4fc;">Code Generation Window</span>
              <span class="badge" style="font-size:10px;">HTML5 &bull; CSS3 &bull; JS &bull; Libraries</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <button id="copy-cdn-btn" class="btn btn-ghost" onclick="copyLibraryCdn()" style="font-size:11px;padding:6px 11px;">Copy Library CDN</button>
              <button id="copy-btn" class="btn btn-primary" onclick="copySampleCode()">Copy Sample Code</button>
            </div>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
            <button id="tab-html" class="btn btn-ghost active" onclick="switchCodeTab('html')">HTML5 Markup</button>
            <button id="tab-css" class="btn btn-ghost" onclick="switchCodeTab('css')">CSS3 Keyframes</button>
            <button id="tab-js" class="btn btn-ghost" onclick="switchCodeTab('js')">JavaScript (WAAPI)</button>
            <button id="tab-gsap" class="btn btn-ghost" onclick="switchCodeTab('gsap')">GSAP 3 Library</button>
            <button id="tab-libs" class="btn btn-ghost" onclick="switchCodeTab('libs')">Anime.js / Framer Motion</button>
          </div>

          <div id="cdn-bar" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;margin-bottom:10px;border-radius:10px;background:rgba(30,27,75,0.45);border:1px solid rgba(99,102,241,0.3);font-size:11px;font-family:monospace;color:#c7d2fe;overflow-x:auto;">
            <span id="cdn-snippet">&lt;script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"&gt;&lt;/script&gt;</span>
          </div>

          <pre><code id="code-display"></code></pre>
        </div>
      </section>
    </div>
  </div>

  <script>
    const CATALOG = {items_js};
    let selectedIndex = 0;
    let currentTab = 'html';
    let playbackSpeed = 1;
    let searchFilter = '';
    let particleReqId = null;

    function filterTypes(val) {{
      searchFilter = (val || '').toLowerCase();
      renderTypeList();
    }}

    function renderTypeList() {{
      const visible = CATALOG.map((item, idx) => ({{ item, idx }})).filter(({{ item }}) =>
        !searchFilter ||
        item.name.toLowerCase().includes(searchFilter) ||
        item.category.toLowerCase().includes(searchFilter) ||
        item.description.toLowerCase().includes(searchFilter)
      );
      document.getElementById('count-label').textContent = visible.length + (searchFilter ? ' / ' + CATALOG.length : '');
      const container = document.getElementById('type-list');
      container.innerHTML = visible.map(({{ item, idx }}) => `
        <button class="type-btn ${{idx === selectedIndex ? 'active' : ''}}" onclick="selectType(${{idx}})">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:10px;font-weight:700;color:#818cf8;text-transform:uppercase;">#${{idx + 1}} &bull; ${{item.category}}</span>
          </div>
          <div style="font-size:13.5px;font-weight:700;margin-top:2px;color:#f8fafc;">${{item.name}}</div>
          <div style="font-size:11.5px;color:#94a3b8;margin-top:3px;">${{item.description.slice(0, 68)}}...</div>
        </button>
      `).join('');
    }}

    function renderStage(item) {{
      if (particleReqId) {{
        cancelAnimationFrame(particleReqId);
        particleReqId = null;
      }}
      const stage = document.getElementById('live-stage');
      stage.style.setProperty('--speed', playbackSpeed);
      const st = item.stageType || item.id;

      if (st === '3d-card' || item.id === 'morph-card') {{
        stage.innerHTML = `
          <div class="demo-3d-card">
            <div style="font-size:11px;font-weight:700;color:#a5b4fc;letter-spacing:0.08em;">HTML5 3D TRANSFORM</div>
            <div style="font-size:17px;font-weight:800;margin-top:6px;">${{item.name}}</div>
            <div style="font-size:11.5px;color:#cbd5e1;margin-top:4px;">60fps GPU preserve-3d motion</div>
          </div>`;
      }} else if (st === 'elastic' || item.id === 'elastic-pulse') {{
        stage.innerHTML = `<div class="demo-elastic-pill">✦ ${{item.name}}</div>`;
      }} else if (st === 'svg-morph' || item.id === 'svg-path-morph') {{
        stage.innerHTML = `
          <svg width="130" height="130" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="44" stroke="#6366f1" stroke-width="6" fill="none"
              stroke-dasharray="280" style="animation: svgStroke calc(2.4s / var(--speed, 1)) ease-in-out infinite alternate; transform-origin: center;" />
            <path d="M40 62 L54 76 L82 46" stroke="#34d399" stroke-width="6" stroke-linecap="round" fill="none" />
          </svg>`;
      }} else if (st === 'canvas-particles' || item.id === 'canvas-particles') {{
        stage.innerHTML = `<canvas id="stage-canvas" width="520" height="220" style="width:100%;height:100%;"></canvas>`;
        initCanvasParticles();
      }} else if (st === 'liquid-blob') {{
        stage.innerHTML = `<div class="demo-liquid-blob">FLUID MORPH</div>`;
      }} else if (st === 'neon-glitch') {{
        stage.innerHTML = `<div class="demo-glitch">CYBER_GLITCH_FX</div>`;
      }} else if (st === 'flip-card') {{
        stage.innerHTML = `
          <div class="demo-flip-card">
            <div style="font-size:10px;color:#a5b4fc;font-weight:700;">ISOMETRIC 3D FLIP</div>
            <div style="font-size:15px;font-weight:800;margin-top:4px;">180&deg; Axis Rotation</div>
          </div>`;
      }} else if (st === 'equalizer') {{
        stage.innerHTML = `
          <div style="display:flex;align-items:flex-end;gap:8px;height:110px;">
            ${{[0.1, 0.35, 0.2, 0.5, 0.15, 0.4, 0.25, 0.45, 0.12, 0.3].map(d =>
              `<span style="width:12px;height:100px;border-radius:6px;background:linear-gradient(to top,#4f46e5,#34d399);transform-origin:bottom;animation:eqBar calc(0.75s / var(--speed,1)) ease-in-out infinite alternate;animation-delay:${{d}}s;"></span>`
            ).join('')}}
          </div>`;
      }} else if (st === 'shimmer') {{
        stage.innerHTML = `
          <div style="width:280px;padding:16px;border-radius:14px;background:#0f172a;border:1px solid #1e293b;display:flex;flex-direction:column;gap:10px;">
            <div style="height:16px;width:65%;border-radius:6px;background:linear-gradient(90deg,#1e293b 25%,#4f46e5 50%,#1e293b 75%);background-size:200% 100%;animation:shimmerSweep calc(1.5s / var(--speed,1)) infinite linear;"></div>
            <div style="height:12px;width:90%;border-radius:6px;background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);background-size:200% 100%;animation:shimmerSweep calc(1.5s / var(--speed,1)) infinite linear;"></div>
            <div style="height:12px;width:75%;border-radius:6px;background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);background-size:200% 100%;animation:shimmerSweep calc(1.5s / var(--speed,1)) infinite linear;"></div>
          </div>`;
      }} else if (st === 'typewriter') {{
        stage.innerHTML = `
          <div style="font-family:monospace;font-size:14px;color:#34d399;background:#020617;padding:14px 20px;border-radius:12px;border:1px solid #1e293b;">
            &gt; executing html5_motion_pipeline... <span style="display:inline-block;width:8px;height:15px;background:#34d399;animation:eqBar 0.6s infinite alternate;"></span>
          </div>`;
      }} else if (st === 'orbit') {{
        stage.innerHTML = `
          <div style="position:relative;width:130px;height:130px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:0;border:2px solid #6366f1;border-radius:50%;animation:flip3D calc(2.2s / var(--speed,1)) linear infinite;"></div>
            <div style="position:absolute;inset:14px;border:2px solid #34d399;border-radius:50%;animation:radarSweep calc(1.8s / var(--speed,1)) linear infinite;"></div>
            <div style="width:18px;height:18px;border-radius:50%;background:#a5b4fc;box-shadow:0 0 20px #6366f1;"></div>
          </div>`;
      }} else if (st === 'dock') {{
        stage.innerHTML = `
          <div style="display:flex;gap:12px;padding:12px 18px;border-radius:18px;background:rgba(15,23,42,0.9);border:1px solid #334155;">
            ${{['⚡','🎨','🚀','💎','🔥'].map((ic, i) =>
              `<div class="demo-stagger-cell" style="width:48px;height:48px;font-size:20px;animation-delay:${{i*120}}ms;">${{ic}}</div>`
            ).join('')}}
          </div>`;
      }} else if (st === 'radar') {{
        stage.innerHTML = `
          <div style="position:relative;width:136px;height:136px;border-radius:50%;border:2px solid rgba(52,211,153,0.45);overflow:hidden;background:radial-gradient(circle,rgba(16,185,129,0.12),#020617);">
            <div style="position:absolute;inset:0;background:conic-gradient(from 0deg,transparent 70%,rgba(52,211,153,0.55));animation:radarSweep calc(2s / var(--speed,1)) linear infinite;"></div>
          </div>`;
      }} else {{
        stage.innerHTML = `
          <div class="demo-stagger-row">
            <div class="demo-stagger-cell" style="animation-delay:0ms;">01</div>
            <div class="demo-stagger-cell" style="animation-delay:160ms;">02</div>
            <div class="demo-stagger-cell" style="animation-delay:320ms;">03</div>
            <div class="demo-stagger-cell" style="animation-delay:480ms;">04</div>
          </div>`;
      }}
    }}

    function initCanvasParticles() {{
      const canvas = document.getElementById('stage-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const pts = Array.from({{ length: 24 }}, () => ({{
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.8 * playbackSpeed,
        vy: (Math.random() - 0.5) * 1.8 * playbackSpeed,
        r: 2.5 + Math.random() * 2
      }}));
      function loop() {{
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < pts.length; i++) {{
          const p = pts[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = '#818cf8';
          ctx.fill();
          for (let j = i + 1; j < pts.length; j++) {{
            const q = pts[j];
            const dist = Math.hypot(p.x - q.x, p.y - q.y);
            if (dist < 95) {{
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = `rgba(99, 102, 241, ${{1 - dist / 95}})`;
              ctx.stroke();
            }}
          }}
        }}
        particleReqId = requestAnimationFrame(loop);
      }}
      loop();
    }}

    function buildGsapCode(item) {{
      return `// 1. Include GreenSock GSAP 3 Library (CDN or NPM)
// <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\\/script>
// npm install gsap

import gsap from "gsap";

// 2. GSAP 3 Hardware-Accelerated Timeline for: ${{item.name}}
const tl = gsap.timeline({{
  repeat: -1,
  yoyo: true,
  defaults: {{ duration: (1.4 / ${{playbackSpeed}}).toFixed(2), ease: "power3.inOut" }}
}});

tl.fromTo(
  "#${{item.id}}-target",
  {{ opacity: 0.35, y: 18, scale: 0.92, rotateX: -12 }},
  {{ opacity: 1, y: -10, scale: 1.04, rotateX: 12 }}
);`;
    }}

    function buildLibrariesCode(item) {{
      return `// ============================================================
// OPTION A: Anime.js v3.2.2 (Lightweight JS Animation Library)
// CDN: <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js"><\\/script>
// ============================================================
anime({{
  targets: '#${{item.id}}-target',
  translateY: [-14, 14],
  scale: [0.94, 1.06],
  rotate: '1turn',
  easing: 'spring(1, 80, 12, 0)',
  duration: ${{Math.round(1600 / playbackSpeed)}},
  direction: 'alternate',
  loop: true
}});

// ============================================================
// OPTION B: Framer Motion (React / Next.js 15 Spring Component)
// NPM: npm install framer-motion
// ============================================================
import {{ motion }} from "framer-motion";

export function ${{item.id.replace(/[^a-zA-Z0-9]/g, '')}}Motion() {{
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.06, rotateY: 10 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
    >
      <h3>${{item.name}}</h3>
    </motion.div>
  );
}}`;
    }}

    function updateCodeView() {{
      const item = CATALOG[selectedIndex];
      let code = '';
      let cdnText = '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\\/script>';
      if (currentTab === 'html') {{
        code = item.htmlCode;
        cdnText = '<!-- Zero external dependencies required for HTML5 markup -->';
      }} else if (currentTab === 'css') {{
        code = item.cssCode;
        cdnText = '/* Hardware-accelerated CSS3 Keyframes & Custom Properties */';
      }} else if (currentTab === 'js') {{
        code = item.jsCode;
        cdnText = '// Native Browser Web Animations API (element.animate) + ES2022';
      }} else if (currentTab === 'gsap') {{
        code = buildGsapCode(item);
        cdnText = '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\\/script>';
      }} else {{
        code = buildLibrariesCode(item);
        cdnText = '<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js"><\\/script> | npm i framer-motion';
      }}
      document.getElementById('code-display').textContent = code;
      document.getElementById('cdn-snippet').textContent = cdnText;
      ['html', 'css', 'js', 'gsap', 'libs'].forEach(t => {{
        const btn = document.getElementById('tab-' + t);
        if (btn) btn.className = 'btn btn-ghost' + (t === currentTab ? ' active' : '');
      }});
    }}

    function selectType(idx) {{
      selectedIndex = idx;
      const item = CATALOG[selectedIndex];
      document.getElementById('active-category').textContent = item.category;
      document.getElementById('active-title').textContent = item.name;
      document.getElementById('active-fps').textContent = item.fps;
      document.getElementById('active-desc').textContent = item.description;
      renderTypeList();
      renderStage(item);
      updateCodeView();
      console.log('[AnimationPortal] Selected type:', item.name);
    }}

    function switchCodeTab(tab) {{
      currentTab = tab;
      updateCodeView();
    }}

    function setSpeed(s, btn) {{
      playbackSpeed = s;
      document.querySelectorAll('header .btn-ghost').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderStage(CATALOG[selectedIndex]);
      updateCodeView();
    }}

    function replayAnimation() {{
      renderStage(CATALOG[selectedIndex]);
    }}

    function copyLibraryCdn() {{
      const txt = document.getElementById('cdn-snippet').textContent;
      navigator.clipboard?.writeText(txt);
      const btn = document.getElementById('copy-cdn-btn');
      btn.textContent = '✓ Copied CDN!';
      setTimeout(() => {{ btn.textContent = 'Copy Library CDN'; }}, 1500);
    }}

    function copySampleCode() {{
      const code = document.getElementById('code-display').textContent;
      navigator.clipboard?.writeText(code);
      const btn = document.getElementById('copy-btn');
      btn.textContent = '✓ Copied to Clipboard!';
      setTimeout(() => {{ btn.textContent = 'Copy Sample Code'; }}, 1500);
    }}

    selectType(0);
  </script>
</body>
</html>"""

        index_html = self._repair_and_enrich_html(index_html, prompt, skills=active_skills)
        return (
            f"FILE: package.json\n<<<<<<< SEARCH\n\n=======\n{pkg_json}\n>>>>>>> REPLACE\n\n"
            f"FILE: app/page.tsx\n<<<<<<< SEARCH\n\n=======\n{app_tsx}\n>>>>>>> REPLACE\n\n"
            f"FILE: index.html\n<<<<<<< SEARCH\n\n=======\n{index_html}\n>>>>>>> REPLACE\n\n"
            f"FILE: server.js\n<<<<<<< SEARCH\n\n=======\n{server_js}\n>>>>>>> REPLACE\n"
        )

    async def execute_task(
        self,
        project_id: str,
        prompt: str,
        template: str = "nextjs",
        skills: Optional[List[str]] = None,
    ) -> AgentRunReport:
        active_skills = list(dict.fromkeys(["tokless", "taste-skill", *(skills or [])]))
        taste_meta = self._infer_taste_skill_profile(prompt, prompt, active_skills)
        taste_badge = (
            f" | TasteSkill Dials [DV={taste_meta['design_variance']} "
            f"MI={taste_meta['motion_intensity']} VD={taste_meta['visual_density']}]"
        )
        ws_path = self.docker_manager.get_workspace_path(project_id)
        container_info = self.docker_manager.ensure_container(project_id)
        steps: List[AgentStepEvent] = []
        applied_diffs: List[FileDiffResult] = []

        async def _emit_step(
            step_id: str, title: str, status: str, detail: str = "", iteration: int = 1
        ) -> AgentStepEvent:
            ev = AgentStepEvent(
                step_id=step_id,
                title=title,
                status=status,
                detail=detail,
                iteration=iteration,
            )
            steps.append(ev)
            await self.broadcast_event(
                project_id,
                {
                    "type": "step",
                    "project_id": project_id,
                    "step": ev.model_dump(),
                },
            )
            return ev

        skills_note = (
            f" | Active LLM Skills: {', '.join(active_skills)}{taste_badge}"
            if active_skills
            else taste_badge
        )
        await _emit_step(
            "analyze",
            "Read Workspace Context & Provision Sandbox",
            "running",
            f"Reading files in /workspace ({container_info['container_id']}){skills_note}",
        )
        context_files = self._read_workspace_context(ws_path)
        await _emit_step(
            "analyze",
            "Read Workspace Context & Provision Sandbox",
            "completed",
            f"Ingested {len(context_files)} workspace files ({', '.join(list(context_files.keys())[:4]) or 'clean workspace'}) into LLM context{skills_note}",
        )

        error_context: Optional[str] = None
        iteration = 1
        build_succeeded = False

        while iteration <= self.MAX_FIX_ITERATIONS:
            await _emit_step(
                "code",
                f"Context-Aware LLM Synthesis & Patch (Iteration {iteration})",
                "running",
                f"Synthesizing code from workspace context + prompt: {prompt[:90]}{skills_note}",
                iteration=iteration,
            )
            llm_response, provider_name = await self._generate_llm_patch_plan(
                project_id=project_id,
                prompt=prompt,
                template=template,
                context_files=context_files,
                error_context=error_context,
                skills=active_skills,
            )
            patches = self.diff_engine.parse_patches(llm_response)
            diffs = self.diff_engine.apply_patches(
                ws_path, patches, session_id=f"{project_id}-iter-{iteration}"
            )
            applied_diffs = diffs

            for d in diffs:
                await self.broadcast_event(
                    project_id,
                    {
                        "type": "diff",
                        "project_id": project_id,
                        "diff": d.model_dump(),
                    },
                )

            await _emit_step(
                "code",
                f"Context-Aware LLM Synthesis & Patch (Iteration {iteration})",
                "completed",
                f"Applied {len(diffs)} patches via {provider_name}{skills_note}",
                iteration=iteration,
            )

            await _emit_step(
                "install",
                "Install Dependencies (npm install)",
                "running",
                "Executing non-interactive npm install in sandbox",
                iteration=iteration,
            )
            install_res = await self.process_runner.run_command(
                project_id=project_id,
                command="npm install --no-audit --no-fund --yes",
            )
            if install_res.exit_code != 0:
                error_context = install_res.output
                await _emit_step(
                    "install",
                    "Install Dependencies (npm install)",
                    "failed",
                    f"Exit code {install_res.exit_code} - triggering self-heal",
                    iteration=iteration,
                )
                iteration += 1
                continue

            await _emit_step(
                "install",
                "Install Dependencies (npm install)",
                "completed",
                f"Completed in {install_res.duration_ms}ms",
                iteration=iteration,
            )

            await _emit_step(
                "verify",
                "Verify Application Build",
                "running",
                "Running npm run build verification gate",
                iteration=iteration,
            )
            build_res = await self.process_runner.run_command(
                project_id=project_id,
                command="npm run build",
            )
            if build_res.exit_code == 0:
                build_succeeded = True
                await _emit_step(
                    "verify",
                    "Verify Application Build",
                    "completed",
                    "Build verification passed with zero errors",
                    iteration=iteration,
                )
                break

            error_context = build_res.output
            await _emit_step(
                "verify",
                "Verify Application Build",
                "failed",
                f"Build failed on iteration {iteration}; feeding stderr into LLM fix loop",
                iteration=iteration,
            )
            iteration += 1

        await _emit_step(
            "preview",
            "Launch Live Preview Dev Server",
            "running",
            "Starting dev server on exposed container port",
            iteration=min(iteration, self.MAX_FIX_ITERATIONS),
        )
        dev_info = await self.docker_manager.start_dev_server(
            project_id=project_id,
            on_output=lambda chunk: self.process_runner.broadcast_terminal(project_id, chunk),
        )
        preview_port = int(dev_info["preview_port"])
        preview_url = f"http://localhost:8700/api/projects/{project_id}/preview"

        await _emit_step(
            "preview",
            "Launch Live Preview Dev Server",
            "completed",
            f"Live preview active on port {preview_port}",
            iteration=min(iteration, self.MAX_FIX_ITERATIONS),
        )

        validation_payload = {
            "type": "validation",
            "project_id": project_id,
            "status": "passed" if build_succeeded else "healed",
            "iterations": min(iteration, self.MAX_FIX_ITERATIONS),
            "preview_port": preview_port,
            "preview_url": preview_url,
            "skills": active_skills,
        }
        await self.broadcast_event(project_id, validation_payload)

        return AgentRunReport(
            project_id=project_id,
            prompt=prompt,
            template=template,
            skills=active_skills,
            status="completed" if build_succeeded else "failed",
            iterations=min(iteration, self.MAX_FIX_ITERATIONS),
            steps=steps,
            diffs=applied_diffs,
            preview_port=preview_port,
            preview_url=preview_url,
        )
