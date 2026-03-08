import type { ReactNode } from 'react';

interface SceneFrameProps {
  width: number;
  height: number;
  className?: string;
  stageClassName?: string;
  checkerboard?: boolean;
  children: ReactNode;
}

export function SceneFrame({ width, height, className = '', stageClassName = '', checkerboard = false, children }: SceneFrameProps) {
  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: `${Math.max(1, width)} / ${Math.max(1, height)}` }}>
      {checkerboard ? (
        <div className="pointer-events-none absolute inset-0 bg-[repeating-conic-gradient(var(--color-background-tertiary)_0%_25%,var(--color-background-quaternary)_0%_50%)] bg-[length:24px_24px]" />
      ) : null}
      <div className={`absolute inset-0 ${stageClassName}`}>
        {children}
      </div>
    </div>
  );
}
