import type * as THREE from "three";
import type { GraphData, RepoLink, RepoNode } from "../hooks/useGraphData";

export type GraphNode = RepoNode;

export type GraphEndpoint = string | GraphNode;

export interface RuntimeGraphLink {
  type: RepoLink["type"];
  source: GraphEndpoint;
  target: GraphEndpoint;
}

export interface GraphInstance {
  renderer: () => THREE.WebGLRenderer;
  scene: () => THREE.Scene;
  camera: () => THREE.Camera;
  graphData: (data: GraphData) => GraphInstance;
  nodeId: (id: string) => GraphInstance;
  nodeVal: (fn: (node: GraphNode) => number) => GraphInstance;
  nodeColor: (fn: (node: GraphNode) => string) => GraphInstance;
  nodeLabel: (fn: (node: GraphNode) => string) => GraphInstance;
  linkColor: (value: string | ((link: RuntimeGraphLink) => string)) => GraphInstance;
  linkWidth: (fn: (link: RuntimeGraphLink) => number) => GraphInstance;
  linkOpacity: (value: number) => GraphInstance;
  linkDirectionalParticles: (fn: (link: RuntimeGraphLink) => number) => GraphInstance;
  linkDirectionalParticleWidth: (fn: (link: RuntimeGraphLink) => number) => GraphInstance;
  linkDirectionalParticleColor: (fn: (link: RuntimeGraphLink) => string) => GraphInstance;
  linkDirectionalParticleSpeed: (value: number) => GraphInstance;
  linkDirectionalParticleResolution: (value: number) => GraphInstance;
  cooldownTicks: (value: number) => GraphInstance;
  onNodeHover: (fn: (node: GraphNode | null) => void) => GraphInstance;
  onNodeClick: (fn: (node: GraphNode | null) => void) => GraphInstance;
  onBackgroundClick: (fn: () => void) => GraphInstance;
  nodeThreeObject: (fn: (node: GraphNode) => THREE.Object3D) => GraphInstance;
  onEngineTick: (fn: () => void) => GraphInstance;
  nodeThreeObjectExtend: (value: boolean) => GraphInstance;
  width: (value: number) => GraphInstance;
  height: (value: number) => GraphInstance;
  cameraPosition: (
    position: { x: number; y: number; z: number },
    lookAt: { x: number; y: number; z: number },
    transitionMs: number,
  ) => void;
  _destructor?: () => void;
}

export function getEndpointId(endpoint: GraphEndpoint): string {
  return typeof endpoint === "string" ? endpoint : endpoint.id;
}
