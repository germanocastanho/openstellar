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

import { useEffect, useRef, useState, useCallback } from "react";
import ForceGraph3D from "3d-force-graph";
import * as THREE from "three";
import type { RepoNode, GraphData } from "../hooks/useGraphData";
import type { GraphInstance, RuntimeGraphLink } from "../types/graph";
import { getEndpointId } from "../types/graph";
import { langColor } from "../utils/languageColors";
import { Tooltip } from "./Tooltip";
import { useBloom, type BloomQuality } from "../hooks/useBloom";
import { createStarSprite, animateStar } from "../utils/starRenderer";
import { createHoverRing, animateHoverRing } from "../utils/hoverEffects";
import { createSelectionRing, animateSelectionRing } from "../utils/selectionEffects";
import { createStarfield, animateStarfield } from "../utils/starfield";
import { createSpaceFog, createDeepSpaceBackground } from "../utils/atmosphere";
import { ActivityPulses } from "../utils/activityPulses";
import styles from "./Galaxy.module.css";

interface Props {
  data: GraphData;
  graphRef: React.MutableRefObject<GraphInstance | null>;
  onLoad: (nodes: RepoNode[]) => void;
  bloomQuality: BloomQuality;
}

function nodeSize(stars: number): number {
  return Math.log10(Math.max(stars, 100)) * 2;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function Galaxy({ data, graphRef, onLoad, bloomQuality }: Props) {
  const [renderContext, setRenderContext] = useState<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
  } | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<{
    node: RepoNode | null;
    x: number;
    y: number;
  }>({ node: null, x: 0, y: 0 });
  const [selected, setSelected] = useState<string | null>(null);
  const starGroups = useRef<Map<string, THREE.Group>>(new Map());
  const hoverRings = useRef<Map<string, THREE.Mesh>>(new Map());
  const selectionRings = useRef<Map<string, THREE.Mesh>>(new Map());
  const selectedRef = useRef<string | null>(null);
  const neighborsRef = useRef<Set<string>>(new Set());
  const hoveredRef = useRef<string | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const lastTimeRef = useRef<number>(0);
  const starfieldRef = useRef<THREE.Group | null>(null);
  const activityPulsesRef = useRef<ActivityPulses | null>(null);

  const bloom = useBloom(
    renderContext?.renderer ?? null,
    renderContext?.scene ?? null,
    renderContext?.camera ?? null,
    bloomQuality,
  );

  const getNeighbors = useCallback(
    (nodeId: string) => {
      const neighbors = new Set<string>();
      for (const link of data.links) {
        const s = getEndpointId(link.source);
        const t = getEndpointId(link.target);
        if (s === nodeId) neighbors.add(t);
        if (t === nodeId) neighbors.add(s);
      }
      return neighbors;
    },
    [data.links],
  );

  useEffect(() => {
    if (!mountRef.current) return;

    const createGraph = ForceGraph3D as unknown as () => (el: HTMLElement) => GraphInstance;
    const graph = createGraph()(mountRef.current);
    lastTimeRef.current = performance.now();

    rendererRef.current = graph.renderer();
    sceneRef.current = graph.scene();
    cameraRef.current = graph.camera();
    setRenderContext({
      renderer: rendererRef.current,
      scene: sceneRef.current,
      camera: cameraRef.current,
    });

    if (sceneRef.current) {
      createSpaceFog(sceneRef.current);
      createDeepSpaceBackground(sceneRef.current);
      const starfield = createStarfield();
      sceneRef.current.add(starfield);
      starfieldRef.current = starfield;
      activityPulsesRef.current = new ActivityPulses(sceneRef.current);
    }

    graph
      .graphData(data)
      .nodeId("id")
      .nodeVal((node: RepoNode) => nodeSize(node.stars))
      .nodeColor((node: RepoNode) => langColor(node.language))
      .nodeLabel(() => "")
      .linkColor((link: RuntimeGraphLink) =>
        link.type === "fork"
          ? "rgba(120,170,255,0.6)"
          : hexToRgba(langColor(
            typeof link.target === "string" ? null : link.target.language,
          ), 0.75),
      )
      .linkWidth((link: RuntimeGraphLink) => (link.type === "fork" ? 1.2 : 2))
      .linkOpacity(0.9)
      .linkDirectionalParticles(
        (link: RuntimeGraphLink) => (link.type === "fork" ? 3 : 4),
      )
      .linkDirectionalParticleWidth((link: RuntimeGraphLink) =>
        link.type === "fork" ? 2.2 : 3.5,
      )
      .linkDirectionalParticleColor((link: RuntimeGraphLink) =>
        link.type === "fork"
          ? "#a0c8ff"
          : hexToRgba(langColor(
            typeof link.target === "string" ? null : link.target.language,
          ), 1),
      )
      .linkDirectionalParticleSpeed(0.004)
      .linkDirectionalParticleResolution(4)
      .cooldownTicks(0)
      .onNodeHover((node: RepoNode | null) => {
        hoveredRef.current = node?.id ?? null;
        setTooltip({
          node: node ?? null,
          x: mousePos.current.x,
          y: mousePos.current.y,
        });
        document.body.style.cursor = node ? "pointer" : "default";
      })
      .onNodeClick((node: RepoNode | null) => {
        if (!node) return;
        setSelected((prev) => (prev === node.id ? null : node.id));
      })
      .onBackgroundClick(() => setSelected(null))
      .nodeThreeObject((node: RepoNode) => {
        const color = langColor(node.language);
        const size = nodeSize(node.stars) * 6;
        const starGroup = createStarSprite(color, node.stars, size);
        const phase = Math.random() * Math.PI * 2;
        starGroup.userData.phase = phase;
        starGroup.userData.nodeId = node.id;

        const ring = createHoverRing(color, size * 0.8);
        ring.position.z = 0.1;
        starGroup.add(ring);
        hoverRings.current.set(node.id, ring);

        const selRing = createSelectionRing(size * 0.8);
        selRing.position.z = 0.05;
        starGroup.add(selRing);
        selectionRings.current.set(node.id, selRing);

        const existing = starGroups.current.get(node.id);
        if (existing) {
          existing.traverse((child) => {
            if (child instanceof THREE.Sprite) {
              child.material.dispose();
            }
          });
          hoverRings.current.delete(node.id);
          selectionRings.current.delete(node.id);
        }
        starGroups.current.set(node.id, starGroup);
        return starGroup;
      })
      .onEngineTick(() => {
        const now = performance.now();
        const t = now / 1000;
        const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
        lastTimeRef.current = now;

        const sel = selectedRef.current;
        const nbrs = neighborsRef.current;
        const hov = hoveredRef.current;

        starGroups.current.forEach((group, id) => {
          const phase = group.userData.phase;
          const isHovered = id === hov;
          const isDimmed = sel !== null && id !== sel && !nbrs.has(id);
          const isSelected = id === sel;
          animateStar(group, t, dt, phase, isDimmed, isHovered);

          const ring = hoverRings.current.get(id);
          if (ring) {
            animateHoverRing(ring, t, isHovered);
          }

          const selRing = selectionRings.current.get(id);
          if (selRing) {
            animateSelectionRing(selRing, t, isSelected);
          }

          const node = data.nodes.find((n) => n.id === id);
          if (node && activityPulsesRef.current && node.x && node.y && node.z) {
            activityPulsesRef.current.checkAndCreatePulse(
              id,
              { x: node.x, y: node.y, z: node.z },
              node.stars,
              t,
            );
          }
        });

        if (activityPulsesRef.current) {
          activityPulsesRef.current.animate();
        }

        if (starfieldRef.current && cameraRef.current) {
          animateStarfield(starfieldRef.current, cameraRef.current, dt);
        }

        if (bloom.enabled) {
          bloom.render();
        }
      })
      .nodeThreeObjectExtend(false);

    const container = mountRef.current;
    const trackMouse = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    container.addEventListener("mousemove", trackMouse);

    graphRef.current = graph;
    onLoad(data.nodes);

    const handleResize = () => {
      graph.width(window.innerWidth).height(window.innerHeight);
      bloom.setSize(window.innerWidth, window.innerHeight);
    };
    const starGroupsMap = starGroups.current;
    const hoverRingsMap = hoverRings.current;
    const selectionRingsMap = selectionRings.current;
    const starfield = starfieldRef.current;
    const scene = sceneRef.current;

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", trackMouse);
      document.body.style.cursor = "";
      setRenderContext(null);

      starGroupsMap.forEach((group) => {
        group.traverse((child) => {
          if (child instanceof THREE.Sprite) {
            child.material.dispose();
          }
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
        });
      });
      starGroupsMap.clear();
      hoverRingsMap.clear();
      selectionRingsMap.clear();
      if (starfield && scene) {
        scene.remove(starfield);
        starfield.traverse((child) => {
          if (child instanceof THREE.Points) {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
        });
      }
      if (activityPulsesRef.current) {
        activityPulsesRef.current.dispose();
      }
      graph._destructor?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    if (!selected) {
      selectedRef.current = null;
      neighborsRef.current = new Set();
      graph
        .linkOpacity(1)
        .linkColor((link: RuntimeGraphLink) =>
          link.type === "fork"
            ? "rgba(100,150,255,0.3)"
            : hexToRgba(langColor(
              typeof link.target === "string" ? null : link.target.language,
            ), 0.5),
        );
      return;
    }
    const neighbors = getNeighbors(selected);
    selectedRef.current = selected;
    neighborsRef.current = neighbors;
    graph.linkColor((link: RuntimeGraphLink) => {
      const s = getEndpointId(link.source);
      const t = getEndpointId(link.target);
      const connected = s === selected || t === selected;
      return connected ? "#FFD700" : "rgba(80,80,80,0.05)";
    });
  }, [selected, getNeighbors, graphRef]);

  return (
    <div className={styles.wrap}>
      <div ref={mountRef} className={styles.canvas} />
      <Tooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} />
    </div>
  );
}
