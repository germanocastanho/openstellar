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

import type { RepoNode } from "../hooks/useGraphData";
import { langColor } from "../utils/languageColors";
import styles from "./Tooltip.module.css";

interface Props {
  node: RepoNode | null;
  x: number;
  y: number;
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function Tooltip({ node, x, y }: Props) {
  if (!node) return null;

  return (
    <div
      className={styles.tooltip}
      style={{
        left: Math.min(x + 16, window.innerWidth - 300),
        top: Math.max(y - 8, 8),
      }}
    >
      <div className={styles.name}>
        <a href={node.url} target="_blank" rel="noreferrer">
          {node.id}
        </a>
      </div>
      <div className={styles.meta}>
        <span
          className={styles.dot}
          style={{ background: langColor(node.language) }}
        />
        <span>{node.language}</span>
        <span className={styles.stars}>
          <span aria-hidden="true">⭐</span>{formatStars(node.stars)}
        </span>
      </div>
      {node.description && (
        <div className={styles.desc}>
          {node.description.slice(0, 120)}
          {node.description.length > 120 ? "…" : ""}
        </div>
      )}
    </div>
  );
}
