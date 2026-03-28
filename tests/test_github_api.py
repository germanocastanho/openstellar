import pytest
from unittest.mock import MagicMock
from indexer.github_api import GithubClient


@pytest.fixture
def mock_client(mocker):
    mocker.patch(
        "requests.Session.get",
        return_value=MagicMock(
            status_code=200,
            json=lambda: {
                "items": [
                    {
                        "full_name": "owner/repo",
                        "name": "repo",
                        "owner": {"login": "owner"},
                        "stargazers_count": 1000,
                        "forks_count": 100,
                        "language": "Python",
                        "description": "A test repo",
                        "topics": ["ai", "ml"],
                        "html_url": "https://github.com/owner/repo",
                        "created_at": "2022-01-01T00:00:00Z",
                        "fork": False,
                    }
                ],
                "total_count": 1,
            },
        ),
    )
    return GithubClient(token="fake")


def test_get_top_repos_returns_list(mock_client):
    repos = mock_client.get_top_repos(limit=3)
    assert isinstance(repos, list)


def test_get_top_repos_fields(mock_client):
    repos = mock_client.get_top_repos(limit=1)
    repo = repos[0]
    assert repo["id"] == "owner/repo"
    assert repo["name"] == "repo"
    assert repo["owner"] == "owner"
    assert repo["stars"] == 1000
    assert repo["forks_count"] == 100
    assert repo["language"] == "Python"
    assert repo["description"] == "A test repo"
    assert repo["topics"] == ["ai", "ml"]
    assert repo["url"] == "https://github.com/owner/repo"
    assert repo["created_at"] == "2022-01-01"
    assert repo["is_ai"] is True
    assert repo["_is_fork"] is False


def test_get_fork_parent_returns_none_for_root(mock_client):
    result = mock_client.get_fork_parent("torvalds/linux")
    assert result is None


def test_rate_limit_retry(mocker):
    sleep_mock = mocker.patch("time.sleep")
    resp_429 = MagicMock()
    resp_429.status_code = 429
    resp_429.headers = {"Retry-After": "1"}
    resp_ok = MagicMock()
    resp_ok.status_code = 200
    resp_ok.json.return_value = {"items": [], "total_count": 0}
    session_mock = mocker.patch(
        "requests.Session.get", side_effect=[resp_429, resp_ok]
    )
    client = GithubClient(token="fake")
    client._get(
        "https://api.github.com/search/repositories", params={"q": "stars:>100"}
    )
    assert session_mock.call_count == 2
    sleep_mock.assert_called_once_with(1)
