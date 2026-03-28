/*
 * Copyleft 🄯 2026, Germano Castanho
 * Free software under the GNU GPL v3
 */

import * as THREE from "three";

export function createHoverRing(color: string, radius: number): THREE.Mesh {
  const geometry = new THREE.RingGeometry(radius * 0.9, radius * 1.1, 32);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.userData.baseRadius = radius;
  ring.userData.pulsePhase = Math.random() * Math.PI * 2;
  return ring;
}

export function animateHoverRing(
  ring: THREE.Mesh,
  t: number,
  visible: boolean,
): void {
  const mat = ring.material as THREE.MeshBasicMaterial;
  const { baseRadius, pulsePhase } = ring.userData;

  if (!visible) {
    mat.opacity = Math.max(0, mat.opacity - 0.05);
    return;
  }

  mat.opacity = Math.min(0.6, mat.opacity + 0.08);
  const pulse = 1 + 0.15 * Math.sin(t * 4 + pulsePhase);
  const scale = baseRadius * pulse;

  const geo = ring.geometry as THREE.RingGeometry;
  geo.dispose();
  ring.geometry = new THREE.RingGeometry(scale * 0.9, scale * 1.1, 32);
}
