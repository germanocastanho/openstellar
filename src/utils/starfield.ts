/*
 * Copyleft 🄯 2026, Germano Castanho
 * Free software under the GNU GPL v3
 */

import * as THREE from "three";

export function createStarfield(
  count = 15000,
  radius = 3000,
): THREE.Group {
  const group = new THREE.Group();
  const layers = [
    { distance: 0.6, size: 0.8, opacity: 0.3, count: count * 0.2 },
    { distance: 0.8, size: 1.2, opacity: 0.5, count: count * 0.3 },
    { distance: 1.0, size: 1.6, opacity: 0.7, count: count * 0.5 },
  ];

  layers.forEach((layer, layerIdx) => {
    const layerCount = Math.floor(layer.count);
    const positions = new Float32Array(layerCount * 3);
    const sizes = new Float32Array(layerCount);
    const colors = new Float32Array(layerCount * 3);

    for (let i = 0; i < layerCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * layer.distance;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      sizes[i] = layer.size * (0.8 + Math.random() * 0.4);

      const temp = 0.6 + Math.random() * 0.4;
      if (Math.random() > 0.95) {
        colors[i * 3] = 0.8 + temp * 0.2;
        colors[i * 3 + 1] = 0.7 + temp * 0.15;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = temp;
        colors[i * 3 + 1] = temp;
        colors[i * 3 + 2] = temp;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        opacity: { value: layer.opacity },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = opacity * (1.0 - dist * 2.0);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.userData.layerIndex = layerIdx;
    points.userData.rotationSpeed = 0.00005 * (1 + layerIdx * 0.3);
    group.add(points);
  });

  group.userData.isStarfield = true;
  return group;
}

export function animateStarfield(
  starfield: THREE.Group,
  camera: THREE.Camera,
  dt: number,
): void {
  starfield.children.forEach((child) => {
    if (child instanceof THREE.Points) {
      const speed = child.userData.rotationSpeed;
      const layerIndex = child.userData.layerIndex;
      const parallaxFactor = 0.15 * (1 + layerIndex * 0.5);

      child.rotation.y += speed * dt * 60;

      const cameraOffset = camera.position.clone().multiplyScalar(-parallaxFactor);
      child.position.lerp(cameraOffset, 0.05);
    }
  });
}
