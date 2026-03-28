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

import { useState, useMemo, useRef, useEffect } from "react";
import Fuse from "fuse.js";
import type { RepoNode } from "../hooks/useGraphData";
import { langColor } from "../utils/languageColors";
import styles from "./SearchBar.module.css";

interface Props {
  nodes: RepoNode[];
  onSelect: (node: RepoNode) => void;
}

export function SearchBar({ nodes, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const justSelected = useRef(false);

  const fuse = useMemo(
    () =>
      new Fuse(nodes, {
        keys: [
          { name: "id", weight: 0.4 },
          { name: "name", weight: 0.3 },
          { name: "description", weight: 0.2 },
          { name: "owner", weight: 0.1 },
        ],
        threshold: 0.4,
        distance: 100,
        minMatchCharLength: 2,
      }),
    [nodes],
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const matches = fuse.search(query, { limit: 1000 });
    return matches.slice(0, 8).map((m) => m.item);
  }, [query, fuse]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  function handleSelect(node: RepoNode) {
    justSelected.current = true;
    setQuery(node.id);
    setOpen(false);
    setActiveIndex(0);
    onSelect(node);
    inputRef.current?.blur();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
    setActiveIndex(0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    }
  }

  function formatStars(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }

  return (
    <div ref={ref} className={styles.wrap}>
      <input
        ref={inputRef}
        className={styles.input}
        placeholder="Search repository... (fuzzy)"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (!justSelected.current && query.trim()) setOpen(true);
          justSelected.current = false;
        }}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
      />
      {open && query.trim() && (
        <div className={styles.dropdown} role="listbox">
          {results.length === 0 ? (
            <div className={styles.empty}>No repositories found</div>
          ) : (
            results.map((n, i) => (
              <button
                key={n.id}
                className={`${styles.card}${i === activeIndex ? ` ${styles.active}` : ""}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={() => handleSelect(n)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.cardId}>{n.id}</span>
                  <span className={styles.cardStars}>
                    ⭐ {formatStars(n.stars)}
                  </span>
                </div>
                <div className={styles.cardMeta}>
                  <span
                    className={styles.cardDot}
                    style={{ background: langColor(n.language) }}
                  />
                  <span className={styles.cardLang}>{n.language}</span>
                </div>
                {n.description && (
                  <div className={styles.cardDesc}>
                    {n.description.slice(0, 80)}
                    {n.description.length > 80 ? "…" : ""}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
