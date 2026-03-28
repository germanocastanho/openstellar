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

import { useState, useEffect } from "react";

export interface RepoNode {
  id: string;
  name: string;
  owner: string;
  stars: number;
  forks_count: number;
  language: string;
  description: string | null;
  topics: string[];
  url: string;
  created_at: string;
  is_ai: boolean;
  x?: number;
  y?: number;
  z?: number;
}

export interface RepoLink {
  source: string;
  target: string;
  type: "fork" | "dependency";
}

export interface GraphData {
  nodes: RepoNode[];
  links: RepoLink[];
}

type Status = "loading" | "error" | "ready";

async function fetchGz<T>(url: string, signal: AbortSignal): Promise<T> {
  const resp = await fetch(url, { signal });
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  const clone = resp.clone();
  try {
    const ds = new DecompressionStream("gzip");
    const stream = resp.body!.pipeThrough(ds);
    const text = await new Response(stream).text();
    return JSON.parse(text) as T;
  } catch {
    return clone.json() as Promise<T>;
  }
}

const BASE = import.meta.env.BASE_URL;

export function useGraphData() {
  const [data, setData] = useState<GraphData | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [nodes, links, positions] = await Promise.all([
          fetchGz<RepoNode[]>(`${BASE}data/nodes.json.gz`, controller.signal),
          fetchGz<RepoLink[]>(`${BASE}data/links.json.gz`, controller.signal),
          fetchGz<{ id: string; x: number; y: number; z: number }[]>(
            `${BASE}data/positions.json.gz`,
            controller.signal,
          ),
        ]);

        const posMap = new Map(positions.map((p) => [p.id, p]));
        const nodesWithPos = nodes.map((n) => ({
          ...n,
          ...(posMap.get(n.id) ?? {}),
        }));

        setData({ nodes: nodesWithPos, links });
        setStatus("ready");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    }

    load();
    return () => { controller.abort(); };
  }, []);

  return { data, status, error };
}
