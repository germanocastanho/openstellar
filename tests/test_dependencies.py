import pytest
from indexer.dependencies import parse_manifest, extract_deps


def test_parse_npm_manifest():
    content = '{"dependencies": {"react": "^18.0.0", "three": "^0.160.0"}}'
    deps = parse_manifest("package.json", content)
    assert "react" in deps
    assert "three" in deps


def test_parse_requirements_txt():
    content = "requests==2.31.0\nfastapi>=0.100.0\n# comment\n"
    deps = parse_manifest("requirements.txt", content)
    assert "requests" in deps
    assert "fastapi" in deps
    assert len(deps) == 2


def test_parse_cargo_toml():
    content = '[dependencies]\nserde = "1.0"\ntokio = {version="1", features=["full"]}\n'
    deps = parse_manifest("Cargo.toml", content)
    assert "serde" in deps
    assert "tokio" in deps


def test_parse_go_mod():
    content = (
        'module github.com/owner/repo\ngo 1.21\n'
        'require (\n\tgithub.com/gin-gonic/gin v1.9.1\n'
        '\tgithub.com/stretchr/testify v1.8.4\n)\n'
    )
    deps = parse_manifest("go.mod", content)
    assert "github.com/gin-gonic/gin" in deps


def test_parse_go_mod_single_line_require():
    content = "module github.com/owner/repo\ngo 1.21\nrequire github.com/gin-gonic/gin v1.9.1\n"
    deps = parse_manifest("go.mod", content)
    assert "github.com/gin-gonic/gin" in deps


def test_unknown_manifest_returns_empty():
    deps = parse_manifest("Makefile", "all:\n\techo hi")
    assert deps == []


def test_parse_package_json_excludes_dev_deps():
    content = '{"dependencies": {"react": "^18"}, "devDependencies": {"jest": "^29"}}'
    deps = parse_manifest("package.json", content)
    assert "react" in deps
    assert "jest" not in deps


def test_parse_package_json_malformed_json():
    result = parse_manifest("package.json", "not valid json")
    assert result == []


def test_parse_cargo_excludes_dev_deps():
    content = (
        "[dependencies]\nserde = \"1\"\n\n[dev-dependencies]\nmockall = \"0.11\"\n"
    )
    deps = parse_manifest("Cargo.toml", content)
    assert "serde" in deps
    assert "mockall" not in deps


def test_extract_deps_builds_links():
    node_ids = {"owner/repo-a", "react/react", "numpy/numpy"}
    batch = {
        "owner/repo-a": {
            "package.json": '{"dependencies":{"react":"^18"}}',
            "requirements.txt": "numpy==1.26.0\n",
        }
    }
    links = extract_deps(batch, node_ids)
    assert len(links) == 2
    assert isinstance(links, list)
    for link in links:
        assert "source" in link
        assert "target" in link
        assert link["type"] == "dependency"
        assert link["source"] in node_ids
        assert link["target"] in node_ids
