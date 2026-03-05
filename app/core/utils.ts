import crypto from 'node:crypto';

export const nowIso = (): string => new Date().toISOString();

export const createId = (): string => crypto.randomUUID();
