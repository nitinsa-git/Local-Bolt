import json
import logging
from typing import Any, Dict

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

logger = logging.getLogger("local_dev_studio.api.websocket_routes")


def register_websocket_routes(
    app: FastAPI,
    docker_manager,
    process_runner,
    coding_agent,
) -> None:
    @app.websocket("/ws/terminal/{project_id}")
    async def websocket_terminal_endpoint(websocket: WebSocket, project_id: str) -> None:
        await websocket.accept()
        info = docker_manager.ensure_container(project_id)
        await websocket.send_text(
            json.dumps(
                {
                    "type": "output",
                    "data": (
                        f"\x1b[1;32m[VibeForge Sandbox]\x1b[0m Connected to "
                        f"{info['container_id']} ({info['mode']}) at /workspace\r\n"
                    ),
                }
            )
        )
        for line in process_runner.get_history(project_id):
            await websocket.send_text(json.dumps({"type": "output", "data": line}))

        async def _send_terminal(chunk: str) -> None:
            await websocket.send_text(json.dumps({"type": "output", "data": chunk}))

        process_runner.subscribe_terminal(project_id, _send_terminal)
        try:
            while True:
                raw_msg = await websocket.receive_text()
                try:
                    payload = json.loads(raw_msg)
                    cmd = payload.get("command", "").strip()
                except Exception:
                    cmd = raw_msg.strip()

                if cmd:
                    await process_runner.run_command(project_id=project_id, command=cmd)
        except WebSocketDisconnect:
            logger.info(json.dumps({"event": "ws_terminal_disconnected", "project_id": project_id}))
        finally:
            process_runner.unsubscribe_terminal(project_id, _send_terminal)

    @app.websocket("/ws/agent/{project_id}")
    async def websocket_agent_endpoint(websocket: WebSocket, project_id: str) -> None:
        await websocket.accept()
        for event in coding_agent.get_history(project_id):
            await websocket.send_text(json.dumps(event))

        async def _send_agent_event(event: Dict[str, Any]) -> None:
            await websocket.send_text(json.dumps(event))

        coding_agent.subscribe_agent(project_id, _send_agent_event)
        try:
            while True:
                raw_msg = await websocket.receive_text()
                try:
                    data = json.loads(raw_msg)
                except Exception:
                    data = {"prompt": raw_msg}

                prompt = data.get("prompt", "").strip()
                template = data.get("template", "nextjs")
                if prompt:
                    await coding_agent.execute_task(
                        project_id=project_id,
                        prompt=prompt,
                        template=template,
                    )
        except WebSocketDisconnect:
            logger.info(json.dumps({"event": "ws_agent_disconnected", "project_id": project_id}))
        finally:
            coding_agent.unsubscribe_agent(project_id, _send_agent_event)
