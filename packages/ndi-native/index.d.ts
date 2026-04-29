export type NdiSenderConfig = {
  senderName: string;
  width: number;
  height: number;
  withAlpha: boolean;
};

export type NdiRuntimeInfo = {
  loaded: boolean;
  path: string | null;
};

export type NdiAddonInfo = {
  path: string | null;
};

export function initializeSender(config: NdiSenderConfig): void;

export function sendBgraFrame(senderName: string, frame: Uint8Array, width: number, height: number, stride: number): void;

export function sendRgbaFrame(senderName: string, frame: Uint8Array, width: number, height: number): void;

export function getSenderConnections(senderName: string, timeoutMs?: number): number;

export function destroySender(senderName?: string): void;

export function getRuntimeInfo(): NdiRuntimeInfo;

export function getAddonInfo(): NdiAddonInfo;
