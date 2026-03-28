/*
 * Copyleft 🄯 2026, Germano Castanho
 * Free software under the GNU GPL v3
 */

/*
 * OpenStellar
 * Copyright (C) 2026 Germano Castanho
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const FALLBACK_COLOR = "#8b8b8b";

const colorMap = {
  Python: "#3572A5",
  JavaScript: "#f1e05a",
  TypeScript: "#2b7489",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#ffac45",
  Kotlin: "#A97BFF",
  Scala: "#c22d40",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  Makefile: "#427819",
  HTML: "#e34c26",
  CSS: "#563d7c",
  "Jupyter Notebook": "#DA5B0B",
  Lua: "#000080",
  Vim: "#199f4b",
  Haskell: "#5e5086",
  Elixir: "#6e4a7e",
  Erlang: "#B83998",
  R: "#198CE7",
  MATLAB: "#e16737",
  Julia: "#a270ba",
  Zig: "#ec915c",
  Dart: "#00B4AB",
  CUDA: "#3A4E3A",
  Mojo: "#FF6F00",
} as const;

export function langColor(language: string | null | undefined): string {
  if (!language) return FALLBACK_COLOR;
  return (colorMap as Record<string, string>)[language] ?? FALLBACK_COLOR;
}
