import io
import json
import shutil
import subprocess
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, Response, StreamingResponse
from pydantic import BaseModel, Field

from app.agent.coding_agent import AgentRunReport
from app.agent.skills_registry import LLMSkill
from app.sandbox.docker_manager import ContainerStats

router = APIRouter(prefix="/api")

HIDDEN_META_FILES = {".studio_backups", "node_modules", ".git", ".studio_chat_history.json"}


class CreateProjectRequest(BaseModel):
    template: str = Field(default="nextjs", min_length=1)
    prompt: str = Field(min_length=1)
    project_id: Optional[str] = None
    skills: Optional[List[str]] = None


class CreateEmptyWorkspaceRequest(BaseModel):
    project_id: str = Field(min_length=1)
    template: str = Field(default="nextjs", min_length=1)
    skills: List[str] = Field(default_factory=list)


class ImportWorkspaceRequest(BaseModel):
    project_id: str = Field(min_length=1)
    source: str = Field(min_length=1, description="Local path or Git repository URL")
    skills: List[str] = Field(default_factory=list)


class CreateSkillRequest(BaseModel):
    name: str = Field(min_length=1)
    category: str = Field(default="Custom Skill")
    description: str = Field(min_length=1)
    instructions: str = Field(min_length=1)
    tags: List[str] = Field(default_factory=list)


class UpdateWorkspaceSkillsRequest(BaseModel):
    skills: List[str] = Field(default_factory=list)


class SaveFileRequest(BaseModel):
    path: str = Field(min_length=1)
    content: str


class UpdateEnvRequest(BaseModel):
    env_vars: Dict[str, str]


class InAppAIChatRequest(BaseModel):
    prompt: str = Field(min_length=1)
    system_prompt: str = Field(
        default="You are a helpful AI assistant integrated into this VibeForge application."
    )
    use_rag: bool = False
    json_mode: bool = False
    temperature: float = 0.3
    max_tokens: int = 800


class RAGIngestRequest(BaseModel):
    title: str = Field(min_length=1)
    content: str = Field(min_length=1)
    source_type: str = Field(default="text")
    chunk_size: int = 600
    overlap: int = 100


class RAGQueryRequest(BaseModel):
    query: str = Field(min_length=1)
    top_k: int = 4


class SQLQueryRequest(BaseModel):
    query: Optional[str] = None
    sql: Optional[str] = None
    params: Optional[List[Any]] = None


class ToolExecRequest(BaseModel):
    tool: str = Field(min_length=1)
    arguments: Optional[Dict[str, Any]] = None
    args: Optional[Dict[str, Any]] = None


class GitExportRequest(BaseModel):
    commit_message: str = Field(default="chore: export workspace from VibeForge")
    branch: str = Field(default="main")
    remote_url: Optional[str] = None
    push: bool = False
    author_name: str = Field(default="VibeForge Agent")
    author_email: str = Field(default="agent@vibeforge.local")


class ChatHistoryItem(BaseModel):
    id: str
    project_id: str
    prompt: str
    template: str
    skills: List[str] = Field(default_factory=list)
    status: str
    iterations: int = 1
    files_changed: List[str] = Field(default_factory=list)
    timestamp: str


class WorkspaceMetaResponse(BaseModel):
    project_id: str
    template: str
    template_locked: bool
    skills: List[str] = Field(default_factory=list)
    chat_history: List[ChatHistoryItem]


class WorkspaceSummary(BaseModel):
    project_id: str
    file_count: int
    has_git: bool
    skills: List[str] = Field(default_factory=list)
    last_modified: str
    preview_url: str


class GitStatusResponse(BaseModel):
    project_id: str
    initialized: bool
    branch: str
    remote_url: str
    status_lines: List[str]
    recent_commits: List[str]
    workspace_path: str


class FileEntry(BaseModel):
    path: str
    content: str
    original_content: str = ""
    size: int


def _run_git(ws_path: Path, args: List[str]) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args],
        cwd=str(ws_path),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=30,
    )


def _read_workspace_meta(ws_path: Path, project_id: str) -> WorkspaceMetaResponse:
    meta_file = ws_path / ".studio_chat_history.json"
    if meta_file.exists():
        try:
            raw = json.loads(meta_file.read_text(encoding="utf-8"))
            items = [ChatHistoryItem(**item) for item in raw.get("chat_history", [])]
            saved_skills = list(raw.get("skills", []))
            default_skills = list(dict.fromkeys(["tokless", *saved_skills]))
            return WorkspaceMetaResponse(
                project_id=project_id,
                template=raw.get("template", "nextjs"),
                template_locked=bool(raw.get("template_locked", len(items) > 0)),
                skills=default_skills,
                chat_history=items,
            )
        except Exception:
            pass
    return WorkspaceMetaResponse(
        project_id=project_id,
        template="nextjs",
        template_locked=False,
        skills=["tokless"],
        chat_history=[],
    )


def _write_workspace_meta(ws_path: Path, meta: WorkspaceMetaResponse) -> None:
    meta_file = ws_path / ".studio_chat_history.json"
    meta_file.write_text(
        json.dumps(meta.model_dump(), indent=2),
        encoding="utf-8",
    )


def render_workspace_preview_html(docker_manager, project_id: str) -> HTMLResponse:
    ws_path: Path = docker_manager.get_workspace_path(project_id)
    index_file = ws_path / "index.html"
    scrollbar_css = """<style id="vibeforge-preview-scrollbar">
      :root, html { color-scheme: dark; --taste-dv: 6; --taste-mi: 6; --taste-vd: 5; }
      * { scrollbar-width: thin; scrollbar-color: rgba(99, 102, 241, 0.35) transparent; }
      *::-webkit-scrollbar { width: 5px; height: 5px; }
      *::-webkit-scrollbar-track { background: transparent; }
      *::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.35); border-radius: 9999px; }
      *::-webkit-scrollbar-thumb:hover { background: rgba(129, 140, 248, 0.65); }
      *::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
      td, th, [id^="kpi"], .tabular-nums { font-variant-numeric: tabular-nums; }
    </style>"""
    sdk_and_dock_script = f"""<script id="vibeforge-ai-base-sdk">
    (function() {{
      const PROJECT_ID = {json.dumps(project_id)};
      const API_BASE = window.location.origin + '/api/projects/' + encodeURIComponent(PROJECT_ID);

      async function _post(path, body) {{
        const r = await fetch(API_BASE + path, {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify(body || {{}})
        }});
        return r.json();
      }}

      async function _get(path) {{
        const r = await fetch(API_BASE + path);
        return r.json();
      }}

      if (!window.VibeForgeTaste) {{
        const tasteState = {{
          archetype: 'Precision SaaS & Asymmetric Bento Workbench',
          designVariance: 6,
          motionIntensity: 6,
          visualDensity: 5
        }};
        function applyTasteDials() {{
          const root = document.documentElement;
          root.setAttribute('data-taste-dv', String(tasteState.designVariance));
          root.setAttribute('data-taste-mi', String(tasteState.motionIntensity));
          root.setAttribute('data-taste-vd', String(tasteState.visualDensity));
          root.style.setProperty('--taste-dv', String(tasteState.designVariance));
          root.style.setProperty('--taste-mi', String(tasteState.motionIntensity));
          root.style.setProperty('--taste-vd', String(tasteState.visualDensity));
          const ms = tasteState.motionIntensity <= 3 ? '90ms' : (tasteState.motionIntensity >= 8 ? '380ms' : '220ms');
          root.style.setProperty('--vf-transition-ms', ms);
          document.querySelectorAll('td, th, [id^="kpi"], .stat, .metric, .badge').forEach(el => {{
            el.style.fontVariantNumeric = 'tabular-nums';
          }});
        }}
        window.VibeForgeTaste = {{
          getProfile: () => Object.assign({{}}, tasteState),
          setDials: (dv, mi, vd) => {{
            if (typeof dv === 'number') tasteState.designVariance = Math.max(1, Math.min(10, dv));
            if (typeof mi === 'number') tasteState.motionIntensity = Math.max(1, Math.min(10, mi));
            if (typeof vd === 'number') tasteState.visualDensity = Math.max(1, Math.min(10, vd));
            applyTasteDials();
            return Object.assign({{}}, tasteState);
          }},
          auditDOM: applyTasteDials
        }};
        window.addEventListener('message', (ev) => {{
          if (ev && ev.data && ev.data.type === 'VIBEFORGE_TASTE_DIALS') {{
            window.VibeForgeTaste.setDials(Number(ev.data.dv), Number(ev.data.mi), Number(ev.data.vd));
          }}
        }});
        window.addEventListener('DOMContentLoaded', applyTasteDials);
      }}

      window.VibeForgeSDK = window.VF = {{
        projectId: PROJECT_ID,
        taste: window.VibeForgeTaste,
        ai: {{
          chat: (prompt, opts = {{}}) => _post('/ai/chat', {{
            prompt,
            system_prompt: opts.systemPrompt || 'You are a helpful AI assistant inside this VibeForge app.',
            use_rag: Boolean(opts.useRag),
            json_mode: Boolean(opts.jsonMode),
            temperature: opts.temperature ?? 0.3,
            max_tokens: opts.maxTokens ?? 800
          }})
        }},
        rag: {{
          ingest: (title, content, sourceType = 'text') => _post('/rag/ingest', {{ title, content, source_type: sourceType }}),
          query: (query, topK = 4) => _post('/rag/query', {{ query, top_k: topK }}),
          documents: () => _get('/rag/documents')
        }},
        db: {{
          sql: (query, params = []) => _post('/db/query', {{ query, params }}),
          tables: () => _get('/db/tables'),
          list: (collection) => _get('/db/collections/' + encodeURIComponent(collection)),
          upsert: (collection, item) => _post('/db/collections/' + encodeURIComponent(collection), item),
          remove: (collection, id) => fetch(API_BASE + '/db/collections/' + encodeURIComponent(collection) + '/' + encodeURIComponent(id), {{ method: 'DELETE' }}).then(r => r.json())
        }},
        tools: {{
          exec: (tool, args = {{}}) => _post('/tools/exec', {{ tool, arguments: args }})
        }},
        blueprint: {{
          downloadUrl: API_BASE + '/blueprint/download',
          get: () => _get('/blueprint')
        }},
        prompts: {{
          downloadUrl: API_BASE + '/prompts/download',
          get: () => _get('/prompts')
        }}
      }};
    }})();
    </script>"""
    if index_file.exists():
        raw_html = index_file.read_text(encoding="utf-8", errors="replace")
        if "vibeforge-preview-scrollbar" not in raw_html:
            if "</head>" in raw_html:
                raw_html = raw_html.replace("</head>", f"{scrollbar_css}</head>", 1)
            else:
                raw_html = scrollbar_css + raw_html
        if "vibeforge-ai-base-sdk" not in raw_html:
            if "</body>" in raw_html:
                raw_html = raw_html.replace("</body>", f"{sdk_and_dock_script}</body>", 1)
            else:
                raw_html = raw_html + sdk_and_dock_script
        return HTMLResponse(content=raw_html)
    return HTMLResponse(
        content=f"""<!DOCTYPE html>
<html style="color-scheme:dark;"><head>{scrollbar_css}</head><body style="background:#020617;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
<div style="text-align:center;">
  <h2 style="color:#e2e8f0;margin-bottom:8px;">Sandbox Preview Ready ({project_id})</h2>
  <p style="font-size:14px;">Submit an agent prompt to generate and live-preview your AI application.</p>
</div>
{sdk_and_dock_script}
</body></html>"""
    )


def register_file_routes(
    app_router: APIRouter,
    docker_manager,
    process_runner,
    coding_agent,
    ai_runtime=None,
) -> None:
    @app_router.get("/skills", response_model=List[LLMSkill])
    async def list_llm_skills() -> List[LLMSkill]:
        return coding_agent.skills_registry.list_skills()

    @app_router.post("/skills", response_model=LLMSkill)
    async def create_llm_skill(req: CreateSkillRequest) -> LLMSkill:
        return coding_agent.skills_registry.create_skill(
            name=req.name,
            category=req.category,
            description=req.description,
            instructions=req.instructions,
            tags=req.tags,
        )

    @app_router.put("/projects/{project_id}/skills", response_model=WorkspaceMetaResponse)
    async def update_project_skills(
        project_id: str, req: UpdateWorkspaceSkillsRequest
    ) -> WorkspaceMetaResponse:
        ws_path: Path = docker_manager.get_workspace_path(project_id)
        meta = _read_workspace_meta(ws_path, project_id)
        meta.skills = list(dict.fromkeys(req.skills))
        _write_workspace_meta(ws_path, meta)
        return meta

    @app_router.get("/workspaces", response_model=List[WorkspaceSummary])
    async def list_workspaces() -> List[WorkspaceSummary]:
        root: Path = docker_manager.workspaces_root
        root.mkdir(parents=True, exist_ok=True)
        docker_manager.get_workspace_path("default")

        summaries: List[WorkspaceSummary] = []
        for d in sorted(root.iterdir()):
            if not d.is_dir() or d.name.startswith("."):
                continue
            files = [
                p
                for p in d.rglob("*")
                if p.is_file()
                and not any(
                    part in HIDDEN_META_FILES for part in p.relative_to(d).parts
                )
            ]
            meta = _read_workspace_meta(d, d.name)
            mtime = datetime.fromtimestamp(d.stat().st_mtime, tz=timezone.utc).isoformat()
            summaries.append(
                WorkspaceSummary(
                    project_id=d.name,
                    file_count=len(files),
                    has_git=(d / ".git").exists(),
                    skills=meta.skills,
                    last_modified=mtime,
                    preview_url=f"http://localhost:8700/api/projects/{d.name}/preview",
                )
            )
        return summaries

    @app_router.post("/workspaces/new", response_model=WorkspaceSummary)
    async def create_new_workspace(req: CreateEmptyWorkspaceRequest) -> WorkspaceSummary:
        safe_id = "".join(c for c in req.project_id if c.isalnum() or c in ("-", "_")).strip("-_")
        if not safe_id:
            raise HTTPException(status_code=400, detail="Invalid workspace name")
        ws_path: Path = docker_manager.get_workspace_path(safe_id)
        docker_manager.ensure_container(safe_id)

        selected_skills = list(dict.fromkeys(req.skills))
        meta = WorkspaceMetaResponse(
            project_id=safe_id,
            template=req.template,
            template_locked=False,
            skills=selected_skills,
            chat_history=[],
        )
        _write_workspace_meta(ws_path, meta)

        if not (ws_path / "index.html").exists():
            skills_html = (
                "<div style='margin-top:12px;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;'>"
                + "".join(
                    f"<span style='font-size:11px;padding:3px 9px;border-radius:999px;background:rgba(99,102,241,0.18);border:1px solid rgba(99,102,241,0.4);color:#c7d2fe;font-family:monospace;'>✦ {s}</span>"
                    for s in selected_skills
                )
                + "</div>"
                if selected_skills
                else ""
            )
            starter_html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>{safe_id}</title></head>
<body style="background:#020617;color:#f1f5f9;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;border:1px solid #1e293b;background:#0f172a;padding:32px;border-radius:16px;max-width:460px;">
    <div style="font-size:11px;color:#818cf8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Workspace: {safe_id} ({req.template})</div>
    <h2 style="margin:0 0 8px 0;">New Workspace Ready</h2>
    <p style="color:#94a3b8;font-size:13px;margin:0;">Enter a prompt in the Agent Console and click Launch Autonomous Build to generate your app.</p>
    {skills_html}
  </div>
</body>
</html>"""
            (ws_path / "index.html").write_text(starter_html, encoding="utf-8")

        files = [
            p
            for p in ws_path.rglob("*")
            if p.is_file()
            and not any(
                part in HIDDEN_META_FILES for part in p.relative_to(ws_path).parts
            )
        ]
        return WorkspaceSummary(
            project_id=safe_id,
            file_count=len(files),
            has_git=(ws_path / ".git").exists(),
            skills=selected_skills,
            last_modified=datetime.now(timezone.utc).isoformat(),
            preview_url=f"http://localhost:8700/api/projects/{safe_id}/preview",
        )

    @app_router.post("/workspaces/import", response_model=WorkspaceSummary)
    async def import_existing_workspace(req: ImportWorkspaceRequest) -> WorkspaceSummary:
        safe_id = "".join(c for c in req.project_id if c.isalnum() or c in ("-", "_")).strip("-_")
        if not safe_id:
            raise HTTPException(status_code=400, detail="Invalid target workspace ID")

        ws_path: Path = docker_manager.get_workspace_path(safe_id)
        source = req.source.strip()

        if source.startswith(("http://", "https://", "git@")):
            if any(ws_path.iterdir()):
                shutil.rmtree(ws_path, ignore_errors=True)
                ws_path.mkdir(parents=True, exist_ok=True)
            proc = subprocess.run(
                ["git", "clone", "--depth", "1", source, str(ws_path)],
                capture_output=True,
                text=True,
                timeout=60,
            )
            if proc.returncode != 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Git clone failed: {proc.stderr.strip() or proc.stdout.strip()}",
                )
        else:
            src_path = Path(source).expanduser().resolve()
            if not src_path.exists() or not src_path.is_dir():
                raise HTTPException(
                    status_code=400, detail=f"Source directory not found: {source}"
                )
            for item in src_path.rglob("*"):
                rel = item.relative_to(src_path)
                if any(part in ("node_modules", ".next", ".studio_backups") for part in rel.parts):
                    continue
                dest = ws_path / rel
                if item.is_dir():
                    dest.mkdir(parents=True, exist_ok=True)
                elif item.is_file():
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(item, dest)

        meta = _read_workspace_meta(ws_path, safe_id)
        if req.skills:
            meta.skills = list(dict.fromkeys([*meta.skills, *req.skills]))
            _write_workspace_meta(ws_path, meta)

        files = [
            p
            for p in ws_path.rglob("*")
            if p.is_file()
            and not any(
                part in HIDDEN_META_FILES for part in p.relative_to(ws_path).parts
            )
        ]
        return WorkspaceSummary(
            project_id=safe_id,
            file_count=len(files),
            has_git=(ws_path / ".git").exists(),
            skills=meta.skills,
            last_modified=datetime.now(timezone.utc).isoformat(),
            preview_url=f"http://localhost:8700/api/projects/{safe_id}/preview",
        )

    @app_router.get("/projects/{project_id}/chat-history", response_model=WorkspaceMetaResponse)
    async def get_project_chat_history(project_id: str) -> WorkspaceMetaResponse:
        ws_path: Path = docker_manager.get_workspace_path(project_id)
        return _read_workspace_meta(ws_path, project_id)

    @app_router.post("/projects/create", response_model=AgentRunReport)
    async def create_project(req: CreateProjectRequest) -> AgentRunReport:
        project_id = req.project_id or "default"
        ws_path: Path = docker_manager.get_workspace_path(project_id)
        meta = _read_workspace_meta(ws_path, project_id)

        # Once finalized, enforce the locked Staff Engineer Agent template for this workspace
        effective_template = meta.template if meta.template_locked else req.template
        effective_skills = (
            list(dict.fromkeys(req.skills))
            if req.skills is not None
            else list(meta.skills)
        )

        report = await coding_agent.execute_task(
            project_id=project_id,
            prompt=req.prompt,
            template=effective_template,
            skills=effective_skills,
        )

        # Persist chat history entry and lock Staff Engineer Agent template once finalized
        history_entry = ChatHistoryItem(
            id=str(uuid.uuid4())[:8],
            project_id=project_id,
            prompt=req.prompt,
            template=effective_template,
            skills=effective_skills,
            status=report.status,
            iterations=report.iterations,
            files_changed=[d.file_path for d in report.diffs],
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
        meta.template = effective_template
        meta.template_locked = True
        meta.skills = effective_skills
        meta.chat_history.insert(0, history_entry)
        meta.chat_history = meta.chat_history[:50]
        _write_workspace_meta(ws_path, meta)

        return report

    @app_router.get("/projects/{project_id}/files", response_model=List[FileEntry])
    async def list_project_files(project_id: str) -> List[FileEntry]:
        ws_path: Path = docker_manager.get_workspace_path(project_id)
        backup_root = ws_path / ".studio_backups"
        files: List[FileEntry] = []

        for file_path in sorted(ws_path.rglob("*")):
            if not file_path.is_file():
                continue
            rel = str(file_path.relative_to(ws_path)).replace("\\", "/")
            if (
                rel.startswith(".studio_backups")
                or rel.startswith("node_modules")
                or rel.startswith(".git")
                or rel == ".studio_chat_history.json"
            ):
                continue
            try:
                content = file_path.read_text(encoding="utf-8", errors="replace")
                bak_file = backup_root / f"{rel}.bak"
                orig = (
                    bak_file.read_text(encoding="utf-8", errors="replace")
                    if bak_file.exists()
                    else ""
                )
                files.append(
                    FileEntry(
                        path=rel,
                        content=content,
                        original_content=orig,
                        size=len(content.encode("utf-8")),
                    )
                )
            except Exception:
                continue
        return files

    @app_router.post("/projects/{project_id}/files", response_model=FileEntry)
    async def save_project_file(project_id: str, req: SaveFileRequest) -> FileEntry:
        ws_path: Path = docker_manager.get_workspace_path(project_id)
        rel_path = req.path.lstrip("/\\")
        target = (ws_path / rel_path).resolve()
        if not str(target).startswith(str(ws_path.resolve())):
            raise HTTPException(status_code=400, detail="Invalid file path")

        original = target.read_text(encoding="utf-8") if target.exists() else ""
        coding_agent.diff_engine.create_backup(ws_path, rel_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(req.content, encoding="utf-8")
        return FileEntry(
            path=rel_path,
            content=req.content,
            original_content=original,
            size=len(req.content.encode("utf-8")),
        )

    @app_router.get("/projects/{project_id}/git/status", response_model=GitStatusResponse)
    async def get_git_status(project_id: str) -> GitStatusResponse:
        ws_path: Path = docker_manager.get_workspace_path(project_id)
        initialized = (ws_path / ".git").exists()
        branch = "main"
        remote_url = ""
        status_lines: List[str] = []
        recent_commits: List[str] = []

        if initialized:
            br = _run_git(ws_path, ["rev-parse", "--abbrev-ref", "HEAD"])
            if br.returncode == 0 and br.stdout.strip():
                branch = br.stdout.strip()
            rem = _run_git(ws_path, ["remote", "get-url", "origin"])
            if rem.returncode == 0:
                remote_url = rem.stdout.strip()
            st = _run_git(ws_path, ["status", "--short"])
            if st.returncode == 0:
                status_lines = [line for line in st.stdout.splitlines() if line.strip()]
            lg = _run_git(ws_path, ["log", "-n", "5", "--oneline"])
            if lg.returncode == 0:
                recent_commits = [line for line in lg.stdout.splitlines() if line.strip()]

        return GitStatusResponse(
            project_id=project_id,
            initialized=initialized,
            branch=branch,
            remote_url=remote_url,
            status_lines=status_lines,
            recent_commits=recent_commits,
            workspace_path=str(ws_path),
        )

    @app_router.post("/projects/{project_id}/git/export")
    async def export_project_to_git(
        project_id: str, req: GitExportRequest
    ) -> Dict[str, object]:
        ws_path: Path = docker_manager.get_workspace_path(project_id)
        gitignore = ws_path / ".gitignore"
        if not gitignore.exists():
            gitignore.write_text(
                "node_modules/\n.studio_backups/\n.next/\n.env\n", encoding="utf-8"
            )

        if not (ws_path / ".git").exists():
            init_res = _run_git(ws_path, ["init", "-b", req.branch])
            if init_res.returncode != 0:
                _run_git(ws_path, ["init"])
                _run_git(ws_path, ["checkout", "-B", req.branch])

        _run_git(ws_path, ["config", "user.name", req.author_name])
        _run_git(ws_path, ["config", "user.email", req.author_email])

        if req.remote_url and req.remote_url.strip():
            rem_url = req.remote_url.strip()
            existing_rem = _run_git(ws_path, ["remote", "get-url", "origin"])
            if existing_rem.returncode == 0:
                _run_git(ws_path, ["remote", "set-url", "origin", rem_url])
            else:
                _run_git(ws_path, ["remote", "add", "origin", rem_url])

        _run_git(ws_path, ["add", "-A"])
        commit_res = _run_git(ws_path, ["commit", "-m", req.commit_message])
        commit_output = (commit_res.stdout + "\n" + commit_res.stderr).strip()

        push_output = ""
        pushed = False
        if req.push and req.remote_url and req.remote_url.strip():
            push_res = _run_git(ws_path, ["push", "-u", "origin", req.branch])
            push_output = (push_res.stdout + "\n" + push_res.stderr).strip()
            pushed = push_res.returncode == 0

        await process_runner.broadcast_terminal(
            project_id,
            f"\r\n\x1b[1;32m[Git Export]\x1b[0m Committed workspace '{project_id}' to branch '{req.branch}': {req.commit_message}\r\n",
        )

        status_after = await get_git_status(project_id)
        return {
            "project_id": project_id,
            "committed": True,
            "commit_output": commit_output,
            "pushed": pushed,
            "push_output": push_output,
            "git_status": status_after.model_dump(),
        }

    @app_router.get("/projects/{project_id}/git/archive")
    async def download_workspace_archive(project_id: str) -> StreamingResponse:
        ws_path: Path = docker_manager.get_workspace_path(project_id)
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            for file_path in sorted(ws_path.rglob("*")):
                if not file_path.is_file():
                    continue
                rel = file_path.relative_to(ws_path)
                if any(part in ("node_modules", ".studio_backups") for part in rel.parts):
                    continue
                zf.write(file_path, arcname=str(rel).replace("\\", "/"))
        buf.seek(0)
        headers = {
            "Content-Disposition": f'attachment; filename="{project_id}-git-export.zip"'
        }
        return StreamingResponse(buf, media_type="application/zip", headers=headers)

    @app_router.get("/projects/{project_id}/preview", response_class=HTMLResponse)
    async def get_project_preview(project_id: str) -> HTMLResponse:
        return render_workspace_preview_html(docker_manager, project_id)

    @app_router.get("/projects/{project_id}/container", response_model=ContainerStats)
    async def get_container_governance(project_id: str) -> ContainerStats:
        return docker_manager.get_container_stats(project_id)

    @app_router.post("/projects/{project_id}/container/restart")
    async def restart_container_dev_server(project_id: str) -> Dict[str, object]:
        res = await docker_manager.start_dev_server(
            project_id=project_id,
            on_output=lambda chunk: process_runner.broadcast_terminal(project_id, chunk),
        )
        return {"project_id": project_id, "restarted": True, **res}

    @app_router.put("/projects/{project_id}/container/env")
    async def update_container_env(
        project_id: str, req: UpdateEnvRequest
    ) -> Dict[str, object]:
        updated = docker_manager.set_env_vars(project_id, req.env_vars)
        return {"project_id": project_id, "env_vars": updated}

    # =========================================================================
    # UNIVERSAL AI APP BASE PLATFORM ENDPOINTS (AI Chat, RAG, SQLite, MCP Tools)
    # =========================================================================
    @app_router.post("/projects/{project_id}/ai/chat")
    async def project_in_app_ai_chat(
        project_id: str, req: InAppAIChatRequest
    ) -> Dict[str, Any]:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        return await ai_runtime.run_in_app_ai_chat(
            project_id=project_id,
            prompt=req.prompt,
            system_prompt=req.system_prompt,
            use_rag=req.use_rag,
            json_mode=req.json_mode,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
        )

    @app_router.post("/projects/{project_id}/rag/ingest")
    async def project_rag_ingest(
        project_id: str, req: RAGIngestRequest
    ) -> Dict[str, Any]:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        try:
            return ai_runtime.ingest_document(
                project_id=project_id,
                title=req.title,
                content=req.content,
                source_type=req.source_type,
                chunk_size=req.chunk_size,
                overlap=req.overlap,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app_router.post("/projects/{project_id}/rag/query")
    async def project_rag_query(
        project_id: str, req: RAGQueryRequest
    ) -> List[Dict[str, Any]]:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        return ai_runtime.query_rag(
            project_id=project_id, query=req.query, top_k=req.top_k
        )

    @app_router.get("/projects/{project_id}/rag/documents")
    async def project_rag_documents(project_id: str) -> List[Dict[str, Any]]:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        return ai_runtime.list_rag_documents(project_id=project_id)

    @app_router.post("/projects/{project_id}/db/query")
    async def project_sqlite_query(
        project_id: str, req: SQLQueryRequest
    ) -> Dict[str, Any]:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        sql_str = (req.query or req.sql or "").strip()
        if not sql_str:
            raise HTTPException(status_code=400, detail="SQL query cannot be empty")
        try:
            return ai_runtime.execute_sql(
                project_id=project_id, query=sql_str, params=req.params
            )
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app_router.get("/projects/{project_id}/db/tables")
    async def project_sqlite_tables(project_id: str) -> List[Dict[str, Any]]:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        return ai_runtime.list_tables(project_id=project_id)

    @app_router.get("/projects/{project_id}/db/collections/{collection}")
    async def project_list_collection(
        project_id: str, collection: str
    ) -> List[Dict[str, Any]]:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        return ai_runtime.list_collection(project_id=project_id, collection=collection)

    @app_router.post("/projects/{project_id}/db/collections/{collection}")
    async def project_upsert_collection(
        project_id: str, collection: str, item: Dict[str, Any]
    ) -> Dict[str, Any]:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        return ai_runtime.upsert_collection_item(
            project_id=project_id, collection=collection, item=item
        )

    @app_router.delete("/projects/{project_id}/db/collections/{collection}/{item_id}")
    async def project_delete_collection_item(
        project_id: str, collection: str, item_id: str
    ) -> Dict[str, Any]:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        deleted = ai_runtime.delete_collection_item(
            project_id=project_id, collection=collection, item_id=item_id
        )
        return {"deleted": deleted, "id": item_id}

    @app_router.post("/projects/{project_id}/tools/exec")
    async def project_exec_agent_tool(
        project_id: str, req: ToolExecRequest
    ) -> Dict[str, Any]:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        tool_args = req.arguments if req.arguments is not None else (req.args or {})
        try:
            return await ai_runtime.execute_tool(
                project_id=project_id, tool_name=req.tool, arguments=tool_args
            )
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

    @app_router.get("/projects/{project_id}/blueprint")
    async def get_project_blueprint(project_id: str) -> Dict[str, Any]:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        return ai_runtime.generate_blueprint_data(
            project_id=project_id,
            skills_registry=coding_agent.skills_registry,
        )

    @app_router.get("/projects/{project_id}/blueprint/download")
    async def download_project_blueprint(project_id: str) -> Response:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        bp_data = ai_runtime.generate_blueprint_data(
            project_id=project_id,
            skills_registry=coding_agent.skills_registry,
        )
        fname = bp_data["filename"]
        return Response(
            content=bp_data["content"],
            media_type="text/markdown; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{fname}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
                "Cache-Control": "no-store",
            },
        )

    @app_router.get("/projects/{project_id}/prompts")
    async def get_project_prompts(project_id: str) -> Dict[str, Any]:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        return ai_runtime.generate_prompts_data(project_id=project_id)

    @app_router.get("/projects/{project_id}/prompts/download")
    async def download_project_prompts(project_id: str) -> Response:
        if ai_runtime is None:
            raise HTTPException(status_code=500, detail="AI Runtime not initialized")
        p_data = ai_runtime.generate_prompts_data(project_id=project_id)
        fname = p_data["filename"]
        return Response(
            content=p_data["content"],
            media_type="text/markdown; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{fname}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
                "Cache-Control": "no-store",
            },
        )

    @app_router.get("/llm/status")
    async def get_local_llm_status() -> Dict[str, object]:
        return await coding_agent.llm_manager.get_status()

