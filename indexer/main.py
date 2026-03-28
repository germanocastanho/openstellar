"""
Copyleft 🄯 2026, Germano Castanho
Free software under the GNU GPL v3
"""

# OpenStellar
# Copyright (C) 2026 Germano Castanho
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

import json
import os
import re
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

from indexer.github_api import GithubClient, AI_ANCHOR_REPOS, AI_TOPICS
from indexer.dependencies import extract_deps

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")

DATA_DIR = REPO_ROOT / "data"
MANIFEST_FILES = ["package.json", "requirements.txt", "Cargo.toml", "go.mod"]
GRAPHQL_BATCH = 50
_SAFE_NAME = re.compile(r"^[A-Za-z0-9._-]+$")


def classify_ai(repo: dict) -> bool:
    if AI_ANCHOR_REPOS & {repo["id"]}:
        return True
    return bool(AI_TOPICS & set(repo.get("topics") or []))


def build_fork_links(
    repos: list[dict],
    node_ids: set[str],
    fork_parents: dict[str, str],
) -> list[dict]:
    links = []
    for repo in repos:
        parent = fork_parents.get(repo["id"])
        if parent and parent in node_ids:
            links.append(
                {
                    "source": repo["id"],
                    "target": parent,
                    "type": "fork",
                }
            )
    return links


def fetch_dependency_batch(
    client: GithubClient,
    repo_ids: list[str],
) -> dict[str, dict[str, str]]:
    aliases = []
    for i, rid in enumerate(repo_ids):
        owner, name = rid.split("/", 1)
        if not _SAFE_NAME.match(owner) or not _SAFE_NAME.match(name):
            continue
        for fname in MANIFEST_FILES:
            safe = f"r{i}_{fname.replace('.', '_').replace('-', '_')}"
            aliases.append(
                f'{safe}: repository(owner:"{owner}", name:"{name}")'
                f' {{ object(expression:"HEAD:{fname}")'
                f" {{ ... on Blob {{ text }} }} }}"
            )
    query = "{ " + "\n".join(aliases) + " }"
    try:
        data = client.graphql(query).get("data") or {}
    except Exception as e:
        print(f"Warning: dependency batch failed: {e}", file=sys.stderr)
        return {}

    result: dict[str, dict[str, str]] = {}
    for i, rid in enumerate(repo_ids):
        result[rid] = {}
        for fname in MANIFEST_FILES:
            safe = f"r{i}_{fname.replace('.', '_').replace('-', '_')}"
            blob = (data.get(safe) or {}).get("object") or {}
            text = blob.get("text") or ""
            if text:
                result[rid][fname] = text
    return result


def write_json(data: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False))


def run(limit: int = 25000) -> None:
    token = (os.environ.get("GH_TOKEN") or "").strip()
    if not token:
        sys.exit("GH_TOKEN not set")

    client = GithubClient(token)
    print(f"Fetching top {limit} repos...")
    repos = client.get_top_repos(limit=limit)
    node_ids = {r["id"] for r in repos}

    for repo in repos:
        repo["is_ai"] = classify_ai(repo)

    print(f"Fetched {len(repos)} repos. Collecting fork parents...")
    fork_parents: dict[str, str] = {}
    forked_repos = [r for r in repos if r.get("_is_fork")]
    print(f"  Resolving parents for {len(forked_repos)} forked repos...")
    for repo in forked_repos:
        parent = client.get_fork_parent(repo["id"])
        if parent:
            fork_parents[repo["id"]] = parent
        time.sleep(0.72)

    fork_links = build_fork_links(repos, node_ids, fork_parents)
    print(f"Fork links: {len(fork_links)}")

    print("Fetching dependency manifests via GraphQL...")
    dep_links: list[dict] = []
    batches = [
        repos[i : i + GRAPHQL_BATCH] for i in range(0, len(repos), GRAPHQL_BATCH)
    ]
    for idx, batch in enumerate(batches):
        if idx % 50 == 0:
            print(f"  Batch {idx}/{len(batches)}")
        ids = [r["id"] for r in batch]
        manifests = fetch_dependency_batch(client, ids)
        dep_links.extend(extract_deps(manifests, node_ids))

    anchor_ids = AI_ANCHOR_REPOS & node_ids
    for repo in repos:
        if repo["id"] in anchor_ids:
            repo["is_ai"] = True

    all_links = fork_links + dep_links
    print(f"Total links: {len(all_links)}")

    for repo in repos:
        repo.pop("_is_fork", None)

    write_json(repos, DATA_DIR / "nodes.json")
    write_json(all_links, DATA_DIR / "links.json")
    print(f"Written to {DATA_DIR}")


if __name__ == "__main__":
    run()
