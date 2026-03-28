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

import { lazy, Suspense, Component, type ReactNode, useState, useCallback } from "react";
import { useGraphData } from "./hooks/useGraphData";
import { useCamera } from "./hooks/useCamera";
import { SearchBar } from "./components/SearchBar";
import { QualityToggle } from "./components/QualityToggle";
import type { BloomQuality } from "./hooks/useBloom";
import styles from "./App.module.css";

const Galaxy = lazy(() =>
  import("./components/Galaxy").then((mod) => ({ default: mod.Galaxy }))
);

class GalaxyErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div className={styles.overlay}>
          <div className={styles.error}>
            <p>Erro ao renderizar a galáxia.</p>
            <p className={styles.detail}>{this.state.error}</p>
            <button onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { data, status, error } = useGraphData();
  const { graphRef, initCamera, flyTo } = useCamera();
  const [bloomQuality, setBloomQuality] = useState<BloomQuality>("high");
  const handleBloomChange = useCallback((quality: BloomQuality) => {
    setBloomQuality(quality);
  }, []);

  if (status === "loading") {
    return (
      <div className={styles.overlay}>
        <div className={styles.loader}>
          <div className={styles.bar} />
          <p>Mapeando o universo open source...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.overlay}>
        <div className={styles.error}>
          <p>Falha ao carregar os dados da galáxia.</p>
          <p className={styles.detail}>{error}</p>
          <button onClick={() => window.location.reload()}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={styles.root}>
      <div className={styles.hud}>
        <h1 className={styles.title}>openstellar</h1>
        <SearchBar nodes={data.nodes} onSelect={flyTo} />
        <QualityToggle onChange={handleBloomChange} />
      </div>
      <GalaxyErrorBoundary>
        <Suspense fallback={<div className={styles.overlay}>Carregando galáxia...</div>}>
          <Galaxy data={data} graphRef={graphRef} onLoad={initCamera} bloomQuality={bloomQuality} />
        </Suspense>
      </GalaxyErrorBoundary>
    </div>
  );
}
