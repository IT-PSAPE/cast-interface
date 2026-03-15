import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { NdiSourceStatus } from '@core/types';
import { useNavigation } from '../../../contexts/navigation-context';
import { useNdi } from '../../../contexts/ndi-context';
import { useSlides } from '../../../contexts/slide-context';
import { useRenderScenes } from '../../stage/rendering/render-scene-provider';
import type { RenderScene } from '../../stage/rendering/scene-types';

export interface ProgramOutput {
  scene: RenderScene;
  status: NdiSourceStatus;
  background: 'black' | 'transparent';
}

const ProgramOutputContext = createContext<ProgramOutput | null>(null);

export function ProgramOutputProvider({ children }: { children: ReactNode }) {
  const { outputConfigs } = useNdi();
  const { currentOutputPresentationId } = useNavigation();
  const { liveSlide } = useSlides();
  const { programScene } = useRenderScenes();
  const outputConfig = outputConfigs.audience;
  const status: NdiSourceStatus = currentOutputPresentationId && liveSlide ? 'live' : 'idle';
  const background = outputConfig.withAlpha ? 'transparent' : 'black';

  const value = useMemo<ProgramOutput>(() => ({
    scene: programScene,
    status,
    background,
  }), [programScene, status, background]);

  return <ProgramOutputContext.Provider value={value}>{children}</ProgramOutputContext.Provider>;
}

export function useProgramOutput(): ProgramOutput {
  const value = useContext(ProgramOutputContext);
  if (!value) throw new Error('useProgramOutput must be used within ProgramOutputProvider');
  return value;
}
