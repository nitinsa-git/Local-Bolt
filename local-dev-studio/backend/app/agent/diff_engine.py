import difflib
import json
import logging
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from pydantic import BaseModel

logger = logging.getLogger("local_dev_studio.agent.diff_engine")


class PatchOperation(BaseModel):
    file_path: str
    search_block: str
    replace_block: str


class FileDiffResult(BaseModel):
    file_path: str
    original_content: str
    modified_content: str
    unified_diff: str
    backup_path: Optional[str] = None
    applied: bool = True


class DiffEngine:
    """
    Parses LLM patch responses using standard search-and-replace markers:
    <<<<<<< SEARCH
    ...
    =======
    ...
    >>>>>>> REPLACE
    Applies patches safely with backup creation and rollback functionality.
    """

    PATCH_BLOCK_REGEX = re.compile(
        r"(?:FILE:\s*(?P<file_header>[^\r\n]+)\r?\n)?<<<<<<< SEARCH\r?\n(?P<search>.*?)\r?\n=======\r?\n(?P<replace>.*?)\r?\n>>>>>>> REPLACE",
        re.DOTALL,
    )

    def __init__(self, backup_dir_name: str = ".studio_backups") -> None:
        self.backup_dir_name = backup_dir_name
        self._last_backups: Dict[str, Dict[str, Optional[str]]] = {}

    def parse_patches(self, llm_response: str, default_file: Optional[str] = None) -> List[PatchOperation]:
        operations: List[PatchOperation] = []
        current_file = default_file

        for match in self.PATCH_BLOCK_REGEX.finditer(llm_response):
            header_file = match.group("file_header")
            if header_file:
                current_file = header_file.strip().strip("`")
            target_file = current_file or "index.tsx"
            operations.append(
                PatchOperation(
                    file_path=target_file,
                    search_block=match.group("search"),
                    replace_block=match.group("replace"),
                )
            )
        return operations

    def create_backup(self, workspace_root: Path, rel_path: str) -> Optional[Path]:
        target = (workspace_root / rel_path).resolve()
        if not target.exists():
            return None
        backup_root = workspace_root / self.backup_dir_name
        backup_path = (backup_root / f"{rel_path}.bak").resolve()
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(target, backup_path)
        return backup_path

    def apply_patches(
        self, workspace_root: Path, patches: List[PatchOperation], session_id: str = "default"
    ) -> List[FileDiffResult]:
        """
        Applies a list of search/replace patches atomically to files in `workspace_root`.
        If any patch fails, automatically rolls back modified files from backups.
        """
        results: List[FileDiffResult] = []
        session_backups: Dict[str, Optional[str]] = {}

        try:
            for patch in patches:
                rel_path = patch.file_path.lstrip("/\\")
                target_file = (workspace_root / rel_path).resolve()
                if not str(target_file).startswith(str(workspace_root.resolve())):
                    raise ValueError(f"Path traversal blocked: {rel_path}")

                if rel_path not in session_backups:
                    if target_file.exists():
                        bak = self.create_backup(workspace_root, rel_path)
                        session_backups[rel_path] = str(bak) if bak else None
                    else:
                        session_backups[rel_path] = "__NEW_FILE__"

                original = target_file.read_text(encoding="utf-8") if target_file.exists() else ""

                if not patch.search_block.strip():
                    # Creating or overwriting file when search block is empty
                    modified = patch.replace_block
                elif patch.search_block in original:
                    modified = original.replace(patch.search_block, patch.replace_block, 1)
                else:
                    raise ValueError(f"Search block not found in {rel_path}")

                target_file.parent.mkdir(parents=True, exist_ok=True)
                target_file.write_text(modified, encoding="utf-8")

                unified = "".join(
                    difflib.unified_diff(
                        original.splitlines(keepends=True),
                        modified.splitlines(keepends=True),
                        fromfile=f"a/{rel_path}",
                        tofile=f"b/{rel_path}",
                    )
                )
                results.append(
                    FileDiffResult(
                        file_path=rel_path,
                        original_content=original,
                        modified_content=modified,
                        unified_diff=unified,
                        backup_path=session_backups.get(rel_path),
                        applied=True,
                    )
                )

            self._last_backups[session_id] = session_backups
            logger.info(
                json.dumps(
                    {
                        "event": "patches_applied",
                        "session_id": session_id,
                        "count": len(results),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                )
            )
            return results
        except Exception as exc:
            logger.error(
                json.dumps(
                    {
                        "event": "patch_failed_rolling_back",
                        "session_id": session_id,
                        "error": str(exc),
                    }
                )
            )
            self._rollback_map(workspace_root, session_backups)
            raise

    def rollback(self, workspace_root: Path, session_id: str = "default") -> List[str]:
        session_backups = self._last_backups.get(session_id, {})
        restored = self._rollback_map(workspace_root, session_backups)
        return restored

    def _rollback_map(self, workspace_root: Path, backup_map: Dict[str, Optional[str]]) -> List[str]:
        restored_files: List[str] = []
        for rel_path, backup_marker in backup_map.items():
            target = (workspace_root / rel_path).resolve()
            if backup_marker == "__NEW_FILE__":
                if target.exists():
                    target.unlink()
                    restored_files.append(rel_path)
            elif backup_marker:
                bak_path = Path(backup_marker)
                if bak_path.exists():
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(bak_path, target)
                    restored_files.append(rel_path)
        return restored_files
