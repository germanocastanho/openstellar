/*
 * Copyleft 🄯 2026, Germano Castanho
 * Free software under the GNU GPL v3
 */

import * as THREE from "three";
import { SpringValue } from "./spring";
import { saturateColor } from "./colorUtils";

export type StarType = "dwarf" | "giant" | "supergiant";

export interface StarConfig {
  coreSize: number;
  coronaSize: number;
  glowSize: number;
  coreIntensity: number;
  hasFlare: boolean;
}

const STAR_CONFIGS: Record<StarType, StarConfig> = {
  dwarf: {
    coreSize: 0.3,
    coronaSize: 0.6,
    glowSize: 1.0,
    coreIntensity: 0.6,
    hasFlare: false,
  },
  giant: {
    coreSize: 0.25,
    coronaSize: 0.55,
    glowSize: 1.2,
    coreIntensity: 0.75,
    hasFlare: false,
  },
  supergiant: {
    coreSize: 0.2,
    coronaSize: 0.5,
    glowSize: 1.5,
    coreIntensity: 0.9,
    hasFlare: true,
  },
};

export function classifyStar(stars: number): StarType {
  if (stars < 5000) return "dwarf";
  if (stars < 50000) return "giant";
  return "supergiant";
}

export function createStarSprite(
  color: string,
  stars: number,
  baseScale: number,
): THREE.Group {
  const type = classifyStar(stars);
  const config = STAR_CONFIGS[type];
  const saturatedColor = saturateColor(color, 0.3);
  const group = new THREE.Group();

  const createLayer = (
    size: number,
    coreStop: number,
    colorStop: number,
    haloAlpha: number,
  ): THREE.Sprite => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, `rgba(255,255,255,${coreStop})`);
    grad.addColorStop(0.1, saturatedColor);
    grad.addColorStop(colorStop, hexToRgba(saturatedColor, haloAlpha));
    grad.addColorStop(0.8, hexToRgba(saturatedColor, haloAlpha * 0.3));
    grad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(size, size, 1);
    return sprite;
  };

  const core = createLayer(
    baseScale * config.coreSize,
    config.coreIntensity,
    0.3,
    0.8,
  );
  const corona = createLayer(baseScale * config.coronaSize, 0.4, 0.45, 0.6);
  const glow = createLayer(baseScale * config.glowSize, 0.2, 0.6, 0.4);

  group.add(glow);
  group.add(corona);
  group.add(core);

  if (config.hasFlare) {
    const flare = createFlare(saturatedColor, baseScale);
    group.add(flare);
    const lensFlare = createLensFlare(saturatedColor, baseScale);
    group.add(lensFlare);
  }

  group.userData = {
    type,
    baseScale,
    config,
    layers: { core, corona, glow },
    scaleSpring: new SpringValue(1, 200, 14),
  };

  return group;
}

function createFlare(color: string, baseScale: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.translate(128, 128);
  ctx.globalAlpha = 0.15;

  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    const grad = ctx.createLinearGradient(0, 0, 0, 80);
    grad.addColorStop(0, hexToRgba(color, 0.4));
    grad.addColorStop(0.5, hexToRgba(color, 0.1));
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(-8, 0, 16, 80);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(baseScale * 2, baseScale * 2, 1);
  sprite.userData.isFlare = true;
  return sprite;
}

function createLensFlare(color: string, baseScale: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  ctx.translate(128, 32);

  for (let i = 0; i < 2; i++) {
    const grad = ctx.createLinearGradient(-120, 0, 120, 0);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.3, hexToRgba(color, 0.1));
    grad.addColorStop(0.5, hexToRgba(color, 0.25));
    grad.addColorStop(0.7, hexToRgba(color, 0.1));
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(-120, -2, 240, 4);
    ctx.rotate(Math.PI / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(baseScale * 3, baseScale * 3, 1);
  sprite.userData.isLensFlare = true;
  return sprite;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function animateStar(
  group: THREE.Group,
  t: number,
  dt: number,
  phase: number,
  isDimmed: boolean,
  isHovered: boolean,
): void {
  const { layers, scaleSpring } = group.userData;

  if (isDimmed) {
    scaleSpring.setTarget(0.95);
    const scale = scaleSpring.update(dt);
    group.scale.set(scale, scale, 1);
    layers.core.material.opacity = 0.08;
    layers.corona.material.opacity = 0.05;
    layers.glow.material.opacity = 0.03;
    return;
  }

  if (isHovered) {
    scaleSpring.setTarget(1.6);
    const scale = scaleSpring.update(dt);
    group.scale.set(scale, scale, 1);
    layers.core.material.opacity = 1.0;
    layers.corona.material.opacity = 0.9;
    layers.glow.material.opacity = 0.7;
    return;
  }

  scaleSpring.setTarget(1.0);
  const baseScale = scaleSpring.update(dt);
  const pulse = baseScale * (1 + 0.12 * Math.sin(t * 1.2 + phase));
  const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 3.2 + phase * 1.7));

  group.scale.set(pulse, pulse, 1);
  layers.core.material.opacity = twinkle;
  layers.corona.material.opacity = twinkle * 0.8;
  layers.glow.material.opacity = twinkle * 0.6;

  const flare = group.children.find((c) => c.userData.isFlare);
  if (flare) {
    flare.rotation.z = t * 0.1 + phase;
    (flare as THREE.Sprite).material.opacity = 0.3 + 0.3 * Math.sin(t * 0.8);
  }

  const lensFlare = group.children.find((c) => c.userData.isLensFlare);
  if (lensFlare) {
    lensFlare.rotation.z = t * 0.05;
    (lensFlare as THREE.Sprite).material.opacity = 0.5 + 0.2 * Math.sin(t * 0.6);
  }
}
