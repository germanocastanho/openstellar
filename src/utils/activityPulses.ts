/*
 * Copyleft 🄯 2026, Germano Castanho
 * Free software under the GNU GPL v3
 */

import * as THREE from "three";

interface PulseRing {
  mesh: THREE.Mesh;
  createdAt: number;
  duration: number;
}

export class ActivityPulses {
  private rings: Map<string, PulseRing[]> = new Map();
  private scene: THREE.Scene;
  private nextPulseCheck = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  checkAndCreatePulse(
    nodeId: string,
    position: { x: number; y: number; z: number },
    stars: number,
    t: number,
  ): void {
    if (t < this.nextPulseCheck) return;

    if (stars > 30000 && Math.random() > 0.97) {
      this.createPulse(nodeId, position, stars);
      this.nextPulseCheck = t + 2;
    }
  }

  private createPulse(
    nodeId: string,
    position: { x: number; y: number; z: number },
    stars: number,
  ): void {
    const geometry = new THREE.RingGeometry(1, 1.5, 32);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#8ec5ff"),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);

    const duration = 2000 + (stars / 100000) * 1000;
    const pulse: PulseRing = {
      mesh,
      createdAt: performance.now(),
      duration,
    };

    this.scene.add(mesh);

    if (!this.rings.has(nodeId)) {
      this.rings.set(nodeId, []);
    }
    this.rings.get(nodeId)!.push(pulse);
  }

  animate(): void {
    const now = performance.now();

    this.rings.forEach((pulses, nodeId) => {
      const toRemove: number[] = [];

      pulses.forEach((pulse, idx) => {
        const elapsed = now - pulse.createdAt;
        const progress = elapsed / pulse.duration;

        if (progress >= 1) {
          this.scene.remove(pulse.mesh);
          pulse.mesh.geometry.dispose();
          (pulse.mesh.material as THREE.Material).dispose();
          toRemove.push(idx);
          return;
        }

        const scale = 1 + progress * 30;
        pulse.mesh.scale.set(scale, scale, 1);
        (pulse.mesh.material as THREE.MeshBasicMaterial).opacity =
          0.8 * (1 - progress);
      });

      toRemove.reverse().forEach((idx) => pulses.splice(idx, 1));

      if (pulses.length === 0) {
        this.rings.delete(nodeId);
      }
    });
  }

  dispose(): void {
    this.rings.forEach((pulses) => {
      pulses.forEach((pulse) => {
        this.scene.remove(pulse.mesh);
        pulse.mesh.geometry.dispose();
        (pulse.mesh.material as THREE.Material).dispose();
      });
    });
    this.rings.clear();
  }
}
