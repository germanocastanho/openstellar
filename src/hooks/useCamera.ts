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

import { useRef, useCallback, useEffect } from "react";
import type { RepoNode } from "./useGraphData";
import type { GraphInstance } from "../types/graph";

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useCamera() {
  const graphRef = useRef<GraphInstance | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const initCamera = useCallback((nodes: RepoNode[]) => {
    const graph = graphRef.current;
    if (!graph) return;

    const aiNodes = nodes.filter((n) => n.is_ai);
    if (aiNodes.length === 0) return;

    const cx =
      aiNodes.reduce((s, n) => s + (n.x ?? 0), 0) / aiNodes.length;
    const cy =
      aiNodes.reduce((s, n) => s + (n.y ?? 0), 0) / aiNodes.length;
    const cz =
      aiNodes.reduce((s, n) => s + (n.z ?? 0), 0) / aiNodes.length;

    graph.cameraPosition(
      { x: cx, y: cy, z: cz + 200 },
      { x: cx, y: cy, z: cz },
      0
    );
    timerRef.current = setTimeout(() => {
      const interpolate = (start: number, end: number, progress: number) => {
        const eased = easeInOutCubic(progress);
        return start + (end - start) * eased;
      };

      let startTime: number | null = null;
      const duration = 3000;
      const startZ = cz + 200;
      const endZ = cz + 2500;

      const animate = (time: number) => {
        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const currentZ = interpolate(startZ, endZ, progress);
        graph.cameraPosition(
          { x: cx, y: cy, z: currentZ },
          { x: cx, y: cy, z: cz },
          0,
        );

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, 500);
  }, []);

  const flyTo = useCallback((node: RepoNode) => {
    const graph = graphRef.current;
    if (!graph) return;

    const interpolate = (start: number, end: number, progress: number) => {
      const eased = easeInOutCubic(progress);
      return start + (end - start) * eased;
    };

    const camera = graph.camera();
    const startPos = { ...camera.position };
    const targetPos = {
      x: (node.x ?? 0) + 200,
      y: node.y ?? 0,
      z: node.z ?? 0,
    };
    const lookAt = { x: node.x ?? 0, y: node.y ?? 0, z: node.z ?? 0 };

    let startTime: number | null = null;
    const duration = 1500;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentX = interpolate(startPos.x, targetPos.x, progress);
      const currentY = interpolate(startPos.y, targetPos.y, progress);
      const currentZ = interpolate(startPos.z, targetPos.z, progress);

      graph.cameraPosition(
        { x: currentX, y: currentY, z: currentZ },
        lookAt,
        0,
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  return { graphRef, initCamera, flyTo };
}
