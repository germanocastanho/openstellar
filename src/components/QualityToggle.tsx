/*
 * Copyleft 🄯 2026, Germano Castanho
 * Free software under the GNU GPL v3
 */

import { useState, useEffect } from "react";
import type { BloomQuality } from "../hooks/useBloom";
import styles from "./QualityToggle.module.css";

interface Props {
  onChange: (quality: BloomQuality) => void;
}

const QUALITIES: BloomQuality[] = ["off", "low", "high"];
const LABELS: Record<BloomQuality, string> = {
  off: "Off",
  low: "Low",
  high: "High",
};

export function QualityToggle({ onChange }: Props) {
  const [quality, setQuality] = useState<BloomQuality>(() => {
    const saved = localStorage.getItem("bloom-quality");
    return (saved as BloomQuality) || "high";
  });

  useEffect(() => {
    onChange(quality);
  }, [quality, onChange]);

  const cycle = () => {
    const idx = QUALITIES.indexOf(quality);
    const next = QUALITIES[(idx + 1) % QUALITIES.length];
    setQuality(next);
    localStorage.setItem("bloom-quality", next);
  };

  return (
    <button className={styles.toggle} onClick={cycle} title="Bloom Quality">
      ✨ {LABELS[quality]}
    </button>
  );
}
