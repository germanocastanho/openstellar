import json
import pytest
from pathlib import Path
from indexer.main import classify_ai, build_fork_links, write_json


def test_classify_ai_by_topic():
    repo = {"topics": ["llm", "python"], "id": "owner/repo"}
    assert classify_ai(repo) is True


def test_classify_ai_by_anchor_repo():
    repo = {"topics": [], "id": "huggingface/transformers"}
    assert classify_ai(repo) is True


def test_classify_ai_false():
    repo = {"topics": ["web", "react"], "id": "owner/repo"}
    assert classify_ai(repo) is False


def test_build_fork_links_includes_only_universe():
    repos = [
        {"id": "a/fork", "topics": []},
        {"id": "a/parent", "topics": []},
    ]
    node_ids = {"a/fork", "a/parent"}
    links = build_fork_links(
        repos, node_ids, fork_parents={"a/fork": "a/parent"}
    )
    assert {
        "source": "a/fork", "target": "a/parent", "type": "fork"
    } in links


def test_build_fork_links_drops_out_of_universe():
    node_ids = {"a/fork"}
    links = build_fork_links(
        [{"id": "a/fork", "topics": []}],
        node_ids,
        fork_parents={"a/fork": "not/in/universe"},
    )
    assert links == []


def test_write_json(tmp_path):
    out = tmp_path / "out.json"
    write_json([{"a": 1}], out)
    data = json.loads(out.read_text())
    assert data == [{"a": 1}]
