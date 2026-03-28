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

import { forceSimulation, forceLink, forceManyBody, forceCenter }
  from "d3-force-3d";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "data");

function loadJson(name) {
  try {
    return JSON.parse(readFileSync(join(DATA, name), "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`Error: ${name} not found — did the indexer run?`);
    } else {
      console.error(`Error parsing ${name}: ${err.message}`);
    }
    process.exit(1);
  }
}

function normalise(arr) {
  if (arr.length === 0) return arr;
  const min = arr.reduce((a, b) => (b < a ? b : a), Infinity);
  const max = arr.reduce((a, b) => (b > a ? b : a), -Infinity);
  const range = max - min || 1;
  return arr.map((v) => ((v - min) / range) * 2000 - 1000);
}

const rawNodes = loadJson("nodes.json");
const rawLinks = loadJson("links.json");

if (rawNodes.length === 0) {
  console.error("Error: nodes.json is empty — aborting layout.");
  process.exit(1);
}

const nodes = rawNodes.map((n) => ({ id: n.id }));
const links = rawLinks.map((l) => ({ source: l.source, target: l.target }));

const nodeSet = new Set(nodes.map((n) => n.id));
const validLinks = links.filter(
  (l) => nodeSet.has(l.source) && nodeSet.has(l.target)
);

const TICKS = 500;
console.log(`Nodes: ${nodes.length}, Links: ${validLinks.length}`);
console.log(`Running force simulation (${TICKS} ticks)...`);

const sim = forceSimulation(nodes, 3)
  .force("link", forceLink(validLinks).id((d) => d.id).strength(0.08))
  .force("charge", forceManyBody().strength(-60).distanceMax(800))
  .force("center", forceCenter(0, 0, 0))
  .stop();

for (let i = 0; i < TICKS; i++) {
  sim.tick();
  if (i % 100 === 0 || i === TICKS - 1) {
    process.stdout.write(`  tick ${i}...\n`);
  }
}

const xs = nodes.map((n) => n.x);
const ys = nodes.map((n) => n.y);
const zs = nodes.map((n) => n.z);
const nx = normalise(xs);
const ny = normalise(ys);
const nz = normalise(zs);

const positions = nodes.map((n, i) => ({
  id: n.id,
  x: nx[i],
  y: ny[i],
  z: nz[i],
}));

mkdirSync(DATA, { recursive: true });
writeFileSync(join(DATA, "positions.json"), JSON.stringify(positions) + "\n");
console.log(`Written ${positions.length} positions to data/positions.json`);
