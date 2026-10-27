import json
import logging
from datetime import datetime, timezone
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.agent.ai_app_runtime import WorkspaceAIRuntime
from app.agent.coding_agent import CodingAgent
from app.agent.diff_engine import DiffEngine
from app.api.files_routes import register_file_routes, router as api_router
from app.api.websocket_routes import register_websocket_routes
from app.sandbox.docker_manager import SandboxDockerManager
from app.sandbox.process_runner import ProcessRunner

logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
)
logger = logging.getLogger("local_dev_studio.main")

app = FastAPI(
    title="VibeForge Autonomous Backend",
    version="1.0.0",
    description="VibeForge pure local vibe-coding engine backend with Docker sandbox management and self-healing coding agent.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

docker_manager = SandboxDockerManager()
process_runner = ProcessRunner(docker_manager=docker_manager)
diff_engine = DiffEngine()
coding_agent = CodingAgent(
    docker_manager=docker_manager,
    process_runner=process_runner,
    diff_engine=diff_engine,
)
ai_runtime = WorkspaceAIRuntime(
    docker_manager=docker_manager,
    llm_manager=coding_agent.llm_manager,
)

register_file_routes(
    app_router=api_router,
    docker_manager=docker_manager,
    process_runner=process_runner,
    coding_agent=coding_agent,
    ai_runtime=ai_runtime,
)
app.include_router(api_router)


@app.get("/apps/{project_id}", response_class=HTMLResponse)
async def serve_published_standalone_app(project_id: str) -> HTMLResponse:
    """
    One-Click Standalone App Publish Endpoint:
    Serves any workspace application directly at `/apps/{project_id}` without the Studio IDE wrapper,
    with full access to its isolated SQLite DB, RAG Vector Engine, and Workspace `.env` LLM Runtime.
    """
    from app.api.files_routes import render_workspace_preview_html
    return render_workspace_preview_html(docker_manager, project_id)

register_websocket_routes(
    app=app,
    docker_manager=docker_manager,
    process_runner=process_runner,
    coding_agent=coding_agent,
)


@app.get("/health")
async def health_check() -> Dict[str, object]:
    docker_ok = docker_manager.is_docker_available()
    logger.info(
        json.dumps(
            {
                "event": "health_check",
                "docker_available": docker_ok,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
    )
    return {
        "status": "healthy",
        "docker_daemon_connected": docker_ok,
        "workspaces_root": str(docker_manager.workspaces_root),
    }
