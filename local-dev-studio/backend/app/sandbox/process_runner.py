import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Callable, Coroutine, Dict, List, Optional

from pydantic import BaseModel, Field

from app.sandbox.docker_manager import SandboxDockerManager

logger = logging.getLogger("local_dev_studio.sandbox.process_runner")


class CommandExecutionResult(BaseModel):
    project_id: str
    command: str
    exit_code: int
    output: str
    duration_ms: float
    mode: str = "docker"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ProcessRunner:
    """
    Coordinates command execution and active terminal stream subscribers per project.
    Streams stdout/stderr to connected `/ws/terminal/{project_id}` WebSocket clients.
    """

    def __init__(self, docker_manager: SandboxDockerManager) -> None:
        self.docker_manager = docker_manager
        self._terminal_subscribers: Dict[str, List[Callable[[str], Coroutine[Any, Any, None]]]] = {}
        self._terminal_history: Dict[str, List[str]] = {}

    def subscribe_terminal(
        self, project_id: str, callback: Callable[[str], Coroutine[Any, Any, None]]
    ) -> None:
        self._terminal_subscribers.setdefault(project_id, []).append(callback)

    def unsubscribe_terminal(
        self, project_id: str, callback: Callable[[str], Coroutine[Any, Any, None]]
    ) -> None:
        subs = self._terminal_subscribers.get(project_id, [])
        if callback in subs:
            subs.remove(callback)

    def get_history(self, project_id: str) -> List[str]:
        return list(self._terminal_history.get(project_id, []))

    async def broadcast_terminal(self, project_id: str, text: str) -> None:
        history = self._terminal_history.setdefault(project_id, [])
        history.append(text)
        if len(history) > 500:
            del history[:-500]

        subs = list(self._terminal_subscribers.get(project_id, []))
        for cb in subs:
            try:
                await cb(text)
            except Exception as exc:
                logger.debug(json.dumps({"event": "terminal_subscriber_error", "error": str(exc)}))

    async def run_command(
        self,
        project_id: str,
        command: str,
        on_chunk: Optional[Callable[[str], Coroutine[Any, Any, None]]] = None,
        timeout: int = 180,
    ) -> CommandExecutionResult:
        start_time = asyncio.get_event_loop().time()
        banner = f"\r\n\x1b[1;36m$ {command}\x1b[0m\r\n"
        await self.broadcast_terminal(project_id, banner)
        if on_chunk:
            await on_chunk(banner)

        async def _handle_output(chunk: str) -> None:
            normalized = chunk.replace("\r\n", "\n").replace("\n", "\r\n")
            await self.broadcast_terminal(project_id, normalized)
            if on_chunk:
                await on_chunk(normalized)

        res = await self.docker_manager.exec_command_stream(
            project_id=project_id,
            command=command,
            on_output=_handle_output,
            timeout=timeout,
        )
        duration_ms = round((asyncio.get_event_loop().time() - start_time) * 1000.0, 2)
        return CommandExecutionResult(
            project_id=project_id,
            command=command,
            exit_code=int(res["exit_code"]),
            output=str(res["output"]),
            duration_ms=duration_ms,
            mode=str(res.get("mode", "docker")),
        )
