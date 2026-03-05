import type { MainApi } from '@core/ipc';
import type { NdiOutputState } from '@core/types';

declare global {
  interface LocalFontData {
    family: string;
    fullName: string;
    postscriptName: string;
    style: string;
  }

  interface Window {
    castApi: MainApi & {
      onNdiOutputStateChanged: (callback: (state: NdiOutputState) => void) => () => void;
    };
    queryLocalFonts?: () => Promise<LocalFontData[]>;
  }
}

export {};
