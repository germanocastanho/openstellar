/*
 * Copyleft 🄯 2026, Germano Castanho
 * Free software under the GNU GPL v3
 */

import * as THREE from "three";

export function createSpaceFog(scene: THREE.Scene): void {
  scene.fog = new THREE.FogExp2(0x030611, 0.00015);
}

export function createDeepSpaceBackground(scene: THREE.Scene): void {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(1024, 1024, 0, 1024, 1024, 1024);
  gradient.addColorStop(0, "#0a1428");
  gradient.addColorStop(0.4, "#071020");
  gradient.addColorStop(0.7, "#050915");
  gradient.addColorStop(1, "#030611");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2048, 2048);

  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 2048;
    const y = Math.random() * 2048;
    const size = Math.random() * 1.5;
    const opacity = Math.random() * 0.6 + 0.2;

    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  const geometry = new THREE.SphereGeometry(5000, 60, 40);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    fog: false,
  });

  const skybox = new THREE.Mesh(geometry, material);
  scene.add(skybox);
}
