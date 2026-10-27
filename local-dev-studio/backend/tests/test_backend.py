from pathlib import Path
from fastapi.testclient import TestClient

from app.agent.diff_engine import DiffEngine
from app.main import app


def test_diff_engine_apply_and_rollback(tmp_path: Path) -> None:
    engine = DiffEngine()
    sample_file = tmp_path / "app.ts"
    sample_file.write_text("const greeting = 'hello';\n", encoding="utf-8")

    llm_patch = (
        "FILE: app.ts\n"
        "<<<<<<< SEARCH\n"
        "const greeting = 'hello';\n"
        "=======\n"
        "const greeting = 'world';\n"
        ">>>>>>> REPLACE\n"
    )
    patches = engine.parse_patches(llm_patch)
    assert len(patches) == 1
    results = engine.apply_patches(tmp_path, patches, session_id="s1")
    assert results[0].applied is True
    assert "world" in sample_file.read_text(encoding="utf-8")

    restored = engine.rollback(tmp_path, session_id="s1")
    assert "app.ts" in restored
    assert "hello" in sample_file.read_text(encoding="utf-8")


def test_context_aware_project_creation() -> None:
    client = TestClient(app)
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "healthy"

    anim_prompt = "Create a responsive portal for UI/ UX annimations for HTML5 and also when selected the respective type it also provide a sample code for the same"
    create_resp = client.post(
        "/api/projects/create",
        json={
            "template": "nextjs",
            "prompt": anim_prompt,
            "project_id": "test-animations",
        },
    )
    assert create_resp.status_code == 200
    data = create_resp.json()
    assert data["project_id"] == "test-animations"
    assert len(data["steps"]) >= 4
    assert len(data["diffs"]) >= 3

    preview_html = client.get("/api/projects/test-animations/preview").text
    assert "Copy Sample Code" in preview_html
    assert "HTML5 Markup" in preview_html
    assert "CSS3 Keyframes" in preview_html

    # Follow-up prompt in reference to the existing project: expand to >= 10 animations
    followup_resp = client.post(
        "/api/projects/create",
        json={
            "template": "nextjs",
            "prompt": "Add more annimation type, atleast 10, currently onl5 are there",
            "project_id": "test-animations",
        },
    )
    assert followup_resp.status_code == 200
    updated_html = client.get("/api/projects/test-animations/preview").text
    assert "Organic Liquid Morphing Blob" in updated_html
    assert "Cyberpunk Chromatic Glitch Text" in updated_html
    assert "3D Gyroscopic Orbital Rings" in updated_html
    assert "Applied Project Update" in updated_html



def test_workspace_management_and_git_export(tmp_path: Path) -> None:
    client = TestClient(app)

    new_ws = client.post(
        "/api/workspaces/new",
        json={"project_id": "analytics-app", "template": "nextjs"},
    )
    assert new_ws.status_code == 200
    assert new_ws.json()["project_id"] == "analytics-app"

    ws_list = client.get("/api/workspaces")
    assert ws_list.status_code == 200
    ids = [w["project_id"] for w in ws_list.json()]
    assert "analytics-app" in ids

    ext_dir = tmp_path / "external_proj"
    ext_dir.mkdir()
    (ext_dir / "README.md").write_text("# Imported App\n", encoding="utf-8")
    imp_resp = client.post(
        "/api/workspaces/import",
        json={"project_id": "imported-app", "source": str(ext_dir)},
    )
    assert imp_resp.status_code == 200
    assert imp_resp.json()["project_id"] == "imported-app"

    git_export = client.post(
        "/api/projects/imported-app/git/export",
        json={
            "commit_message": "feat: initial git export from studio",
            "branch": "main",
            "push": False,
        },
    )
    assert git_export.status_code == 200
    git_data = git_export.json()
    assert git_data["committed"] is True
    assert git_data["git_status"]["initialized"] is True

    archive_resp = client.get("/api/projects/imported-app/git/archive")
    assert archive_resp.status_code == 200
    assert archive_resp.headers["content-type"] == "application/zip"


def test_chat_history_and_template_lock() -> None:
    client = TestClient(app)
    pid = "test-locked-agent"

    # Create workspace with nextjs
    client.post("/api/workspaces/new", json={"project_id": pid, "template": "nextjs"})
    meta0 = client.get(f"/api/projects/{pid}/chat-history").json()
    assert meta0["template"] == "nextjs"
    assert meta0["template_locked"] is False

    # Run mission prompt -> should lock template and record chat history
    first_prompt = "Build an interactive API latency monitor dashboard"
    run1 = client.post(
        "/api/projects/create",
        json={"project_id": pid, "template": "nextjs", "prompt": first_prompt},
    )
    assert run1.status_code == 200

    meta1 = client.get(f"/api/projects/{pid}/chat-history").json()
    assert meta1["template_locked"] is True
    assert meta1["template"] == "nextjs"
    assert len(meta1["chat_history"]) >= 1
    assert meta1["chat_history"][0]["prompt"] == first_prompt

    # Attempt to change template to python-fastapi after finalization -> must stay locked as nextjs
    second_prompt = "Add dark mode and CSV export to the latency monitor"
    run2 = client.post(
        "/api/projects/create",
        json={"project_id": pid, "template": "python-fastapi", "prompt": second_prompt},
    )
    assert run2.status_code == 200
    meta2 = client.get(f"/api/projects/{pid}/chat-history").json()
    assert meta2["template"] == "nextjs"
    assert meta2["template_locked"] is True
    assert meta2["chat_history"][0]["prompt"] == second_prompt

