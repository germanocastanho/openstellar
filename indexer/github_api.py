"""
Copyleft 🄯 2026, Germano Castanho
Free software under the GNU GPL v3
"""

import sys
import time
import warnings

import requests

AI_TOPICS = {
    "llm",
    "ai",
    "machine-learning",
    "deep-learning",
    "neural-network",
    "transformers",
    "generative-ai",
    "large-language-model",
    "stable-diffusion",
    "chatgpt",
    "gpt",
    "rag",
    "langchain",
}

AI_ANCHOR_REPOS = {
    "huggingface/transformers",
    "pytorch/pytorch",
    "tensorflow/tensorflow",
    "langchain-ai/langchain",
    "ollama/ollama",
}


def _raise_auth(resp: requests.Response) -> None:
    if resp.status_code == 401:
        print(
            "GitHub API 401: invalid or revoked GH_TOKEN. "
            "Set a real PAT in .env (see README).",
            file=sys.stderr,
        )
    resp.raise_for_status()


class GithubClient:
    BASE = "https://api.github.com"

    def __init__(self, token: str):
        self._session = requests.Session()
        self._session.headers.update(
            {
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            }
        )

    def _get(self, url: str, params: dict | None = None) -> dict:
        retries = 5
        for attempt in range(retries):
            resp = self._session.get(url, params=params)
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code in (429, 403) or resp.status_code >= 500:
                try:
                    wait = int(resp.headers.get("Retry-After", 60))
                except ValueError:
                    wait = 60
                time.sleep(wait)
                continue
            if resp.status_code == 422:
                warnings.warn(
                    f"GitHub Search API 1000-result cap reached for {url}; "
                    "pagination truncated.",
                    stacklevel=2,
                )
                return {}
            _raise_auth(resp)
        raise RuntimeError(f"Failed after {retries} retries: {url}")

    def graphql(
        self, query: str, variables: dict | None = None, retries: int = 5
    ) -> dict:
        for attempt in range(retries):
            resp = self._session.post(
                f"{self.BASE}/graphql",
                json={"query": query, "variables": variables or {}},
            )
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code in (429, 403) or resp.status_code >= 500:
                try:
                    wait = int(resp.headers.get("Retry-After", 60))
                except ValueError:
                    wait = 60
                time.sleep(wait)
                continue
            _raise_auth(resp)
        raise RuntimeError(f"GraphQL failed after {retries} retries")

    def get_top_repos(self, limit: int = 25000) -> list[dict]:
        # The GitHub Search API caps at 1000 results per query (10 pages × 100).
        # Use star-range windows so each query stays within the cap.
        star_windows = [
            "stars:>=50000",
            "stars:20000..49999",
            "stars:10000..19999",
            "stars:5000..9999",
            "stars:2000..4999",
            "stars:1000..1999",
            "stars:500..999",
            "stars:200..499",
            "stars:100..199",
        ]
        seen: set[str] = set()
        repos: list[dict] = []
        per_page = 100

        for window in star_windows:
            if len(repos) >= limit:
                break
            page = 1
            window_count = 0
            while len(repos) < limit:
                data = self._get(
                    f"{self.BASE}/search/repositories",
                    params={
                        "q": window,
                        "sort": "stars",
                        "order": "desc",
                        "per_page": per_page,
                        "page": page,
                    },
                )
                items = data.get("items", [])
                if not items:
                    break
                added = 0
                for item in items:
                    rid = item["full_name"]
                    if rid not in seen:
                        seen.add(rid)
                        repos.append(_parse_repo(item))
                        added += 1
                        window_count += 1
                        if len(repos) >= limit:
                            break
                page += 1
                time.sleep(2.1)
                if page > 10 or not added:
                    break
            print(f"  {window}: {window_count} repos (total {len(repos)})", flush=True)

        return repos

    def get_fork_parent(self, full_name: str) -> str | None:
        data = self._get(f"{self.BASE}/repos/{full_name}")
        if data.get("fork"):
            parent = data.get("parent", {})
            return parent.get("full_name")
        return None


def _parse_repo(item: dict) -> dict:
    topics = item.get("topics") or []
    return {
        "id": item["full_name"],
        "name": item["name"],
        "owner": item["owner"]["login"],
        "stars": item["stargazers_count"],
        "forks_count": item["forks_count"],
        "language": item.get("language") or "Unknown",
        "description": (item.get("description") or "")[:200],
        "topics": topics,
        "url": item["html_url"],
        "created_at": item["created_at"][:10],
        "is_ai": bool(AI_TOPICS & set(topics)),
        "_is_fork": bool(item.get("fork")),
    }
