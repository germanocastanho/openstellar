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
import re


def parse_manifest(filename: str, content: str) -> list[str]:
    if filename == "package.json":
        return _parse_package_json(content)
    if filename == "requirements.txt":
        return _parse_requirements(content)
    if filename == "Cargo.toml":
        return _parse_cargo(content)
    if filename == "go.mod":
        return _parse_go_mod(content)
    return []


def extract_deps(
    batch: dict[str, dict[str, str]],
    node_ids: set[str],
) -> list[dict]:
    links = []
    name_to_id = {rid.split("/")[1].lower(): rid for rid in node_ids}

    for source, manifests in batch.items():
        seen: set[str] = set()
        for filename, content in manifests.items():
            for dep in parse_manifest(filename, content):
                dep_lower = dep.lower().split("/")[-1]
                target = name_to_id.get(dep_lower)
                if target and target != source and target not in seen:
                    links.append(
                        {
                            "source": source,
                            "target": target,
                            "type": "dependency",
                        }
                    )
                    seen.add(target)
    return links


def _parse_package_json(content: str) -> list[str]:
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return []
    deps: dict = {}
    deps.update(data.get("dependencies") or {})
    deps.update(data.get("peerDependencies") or {})
    return [k.split("/")[-1] for k in deps]


def _parse_requirements(content: str) -> list[str]:
    deps = []
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("-"):
            continue
        name = re.split(r"[>=<!;\[]", line)[0].strip()
        if name:
            deps.append(name)
    return deps


def _parse_cargo(content: str) -> list[str]:
    deps = []
    in_deps = False
    for line in content.splitlines():
        stripped = line.strip()
        if stripped == "[dependencies]":
            in_deps = True
            continue
        if stripped.startswith("[") and in_deps:
            in_deps = False
        if in_deps and "=" in stripped and not stripped.startswith("#"):
            name = stripped.split("=")[0].strip()
            deps.append(name)
    return deps


def _parse_go_mod(content: str) -> list[str]:
    deps = []
    in_require = False
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("require ("):
            in_require = True
            continue
        if stripped == ")" and in_require:
            in_require = False
        if in_require and stripped and not stripped.startswith("//"):
            parts = stripped.split()
            if parts:
                deps.append(parts[0])
        elif stripped.startswith("require ") and not stripped.endswith("("):
            parts = stripped.split()
            if len(parts) >= 2:
                deps.append(parts[1])
    return deps
