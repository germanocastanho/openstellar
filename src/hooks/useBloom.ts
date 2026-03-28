/*
 * Copyleft 🄯 2026, Germano Castanho
 * Free software under the GNU GPL v3
 */

import { useRef, useEffect } from "react";
import * as THREE from "three";
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  KernelSize,
} from "postprocessing";

export type BloomQuality = "off" | "low" | "high";

interface BloomConfig {
  strength: number;
  radius: number;
  threshold: number;
  kernelSize: KernelSize;
}

const BLOOM_CONFIGS: Record<Exclude<BloomQuality, "off">, BloomConfig> = {
  low: {
    strength: 0.5,
    radius: 0.3,
    threshold: 0.9,
    kernelSize: KernelSize.SMALL,
  },
  high: {
    strength: 0.8,
    radius: 0.4,
    threshold: 0.85,
    kernelSize: KernelSize.LARGE,
  },
};

export function useBloom(
  renderer: THREE.WebGLRenderer | null,
  scene: THREE.Scene | null,
  camera: THREE.Camera | null,
  quality: BloomQuality,
) {
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomEffectRef = useRef<BloomEffect | null>(null);

  useEffect(() => {
    if (!renderer || !scene || !camera) return;

    if (quality === "off") {
      if (composerRef.current) {
        composerRef.current.dispose();
        composerRef.current = null;
      }
      if (bloomEffectRef.current) {
        bloomEffectRef.current.dispose();
        bloomEffectRef.current = null;
      }
      return;
    }

    const config = BLOOM_CONFIGS[quality];
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomEffect = new BloomEffect({
      intensity: config.strength,
      luminanceThreshold: config.threshold,
      radius: config.radius,
      kernelSize: config.kernelSize,
    });

    const effectPass = new EffectPass(camera, bloomEffect);
    composer.addPass(renderPass);
    composer.addPass(effectPass);

    composerRef.current = composer;
    bloomEffectRef.current = bloomEffect;

    return () => {
      composer.dispose();
      bloomEffect.dispose();
    };
  }, [renderer, scene, camera, quality]);

  const render = () => {
    if (composerRef.current) {
      composerRef.current.render();
    }
  };

  const setSize = (width: number, height: number) => {
    if (composerRef.current) {
      composerRef.current.setSize(width, height);
    }
  };

  return { render, setSize, enabled: quality !== "off" };
}
