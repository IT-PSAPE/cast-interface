import { useEffect, useRef, useState } from 'react';
import { SceneStage } from '@renderer/features/canvas/scene-stage';
import type { RenderScene, SceneSurface } from '@renderer/features/canvas/scene-types';

interface LazySceneStageProps {
  scene: RenderScene;
  surface: SceneSurface;
  className?: string;
}

export function LazySceneStage({ scene, surface, className }: LazySceneStageProps) {
  const [visible, setVisible] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px' },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className={className}>
      {visible ? <SceneStage scene={scene} surface={surface} className="absolute inset-0 pointer-events-none" /> : null}
    </div>
  );
}
