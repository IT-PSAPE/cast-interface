import type { SlideFrame, NdiOutputName, NdiOutputState } from '@core/types';

type NdiNativeModule = {
  initializeSender: (config: { senderName: string; width: number; height: number; withAlpha: boolean }) => void;
  sendRgbaFrame: (senderName: string, buffer: Uint8Array, width: number, height: number, stride: number) => void;
  destroySender: (senderName?: string) => void;
};

interface SenderEntry {
  initialized: boolean;
  senderName: string;
}

const SENDER_NAMES: Record<NdiOutputName, string> = {
  audience: 'Cast Interface - Audience',
  stage: 'Cast Interface - Stage'
};

export class NdiService {
  private module: NdiNativeModule | null = null;
  private senders = new Map<NdiOutputName, SenderEntry>();
  private enabled: NdiOutputState = { audience: false, stage: false };
  private activeOutput: NdiOutputName | null = null;

  private loadNativeModule(): NdiNativeModule | null {
    if (this.module) return this.module;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.module = require('@cast-interface/ndi-native') as NdiNativeModule;
      return this.module;
    } catch (error) {
      console.warn('[NDI] Native module unavailable. Running in no-op mode.', error);
      return null;
    }
  }

  getOutputState(): NdiOutputState {
    return { ...this.enabled };
  }

  setOutputEnabled(name: NdiOutputName, enabled: boolean): NdiOutputState {
    try {
      if (enabled) {
        if (this.activeOutput && this.activeOutput !== name) {
          this.destroySender(this.activeOutput);
          this.enabled[this.activeOutput] = false;
        }
        this.initSender(name);
        this.enabled[name] = this.senders.has(name);
        if (this.enabled[name]) this.activeOutput = name;
      } else {
        this.sendBlackFrame(name);
        this.destroySender(name);
        if (this.activeOutput === name) this.activeOutput = null;
        this.enabled[name] = false;
      }
    } catch (error) {
      console.error(`[NDI] Failed to ${enabled ? 'enable' : 'disable'} output "${name}"`, error);
      this.enabled[name] = false;
      if (this.activeOutput === name) this.activeOutput = null;
    }
    return this.getOutputState();
  }

  sendFrame(frame: SlideFrame): void {
    if (!this.module || !this.activeOutput) return;
    const stride = frame.width * 4;
    const buffer = new Uint8Array(frame.rgba.buffer, frame.rgba.byteOffset, frame.rgba.byteLength);
    const sender = this.senders.get(this.activeOutput);
    if (!sender || !sender.initialized || !this.enabled[this.activeOutput]) return;
    this.module.sendRgbaFrame(sender.senderName, buffer, frame.width, frame.height, stride);
  }

  destroy(): void {
    for (const name of Array.from(this.senders.keys())) {
      this.destroySender(name);
    }
    this.activeOutput = null;
    this.enabled = { audience: false, stage: false };
  }

  private initSender(name: NdiOutputName): void {
    if (this.senders.has(name)) return;
    const mod = this.loadNativeModule();
    if (!mod) return;
    const senderName = SENDER_NAMES[name];
    mod.initializeSender({ senderName, width: 1920, height: 1080, withAlpha: true });
    this.senders.set(name, { initialized: true, senderName });
  }

  private sendBlackFrame(name: NdiOutputName): void {
    const sender = this.senders.get(name);
    if (!sender?.initialized || !this.module) return;
    const width = 1920;
    const height = 1080;
    const stride = width * 4;
    const buffer = new Uint8Array(width * height * 4);
    for (let i = 3; i < buffer.length; i += 4) buffer[i] = 255;
    try {
      this.module.sendRgbaFrame(sender.senderName, buffer, width, height, stride);
    } catch (error) {
      console.warn('[NDI] Failed to send black frame:', error);
    }
  }

  private destroySender(name: NdiOutputName): void {
    const sender = this.senders.get(name);
    if (!sender) return;
    if (sender.initialized && this.module) this.module.destroySender(sender.senderName);
    this.senders.delete(name);
  }
}
