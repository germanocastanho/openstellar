/*
 * Copyleft 🄯 2026, Germano Castanho
 * Free software under the GNU GPL v3
 */

import * as THREE from "three";

export function createSelectionRing(radius: number): THREE.Mesh {
  const geometry = new THREE.RingGeometry(radius * 1.2, radius * 1.4, 48);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color("#FFD700"),
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const ring = new THREE.Mesh(geometry, material);
  ring.userData.baseRadius = radius;
  ring.userData.targetOpacity = 0;
  ring.userData.currentOpacity = 0;
  return ring;
}

export function animateSelectionRing(
  ring: THREE.Mesh,
  t: number,
  isSelected: boolean,
): void {
  const mat = ring.material as THREE.MeshBasicMaterial;
  const { baseRadius } = ring.userData;

  const targetOpacity = isSelected ? 0.9 : 0;
  ring.userData.targetOpacity = targetOpacity;

  const currentOpacity = ring.userData.currentOpacity;
  const newOpacity = currentOpacity + (targetOpacity - currentOpacity) * 0.12;
  ring.userData.currentOpacity = newOpacity;
  mat.opacity = newOpacity;

  if (isSelected) {
    const pulse = 1 + 0.18 * Math.sin(t * 5);
    const scale = baseRadius * pulse;

    const geo = ring.geometry as THREE.RingGeometry;
    geo.dispose();
    ring.geometry = new THREE.RingGeometry(scale * 1.2, scale * 1.4, 48);

    ring.rotation.z = t * 0.3;
  }
}
