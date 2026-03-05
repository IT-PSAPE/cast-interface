import { describe, expect, it } from 'vitest';
import { resolveKonvaTextStyle } from './resolve-konva-text-style';

describe('resolveKonvaTextStyle', () => {
  it('maps weight and italic into valid konva font styles', () => {
    expect(resolveKonvaTextStyle('400', false)).toBe('normal');
    expect(resolveKonvaTextStyle('700', false)).toBe('bold');
    expect(resolveKonvaTextStyle('400', true)).toBe('italic');
    expect(resolveKonvaTextStyle('700', true)).toBe('bold italic');
    expect(resolveKonvaTextStyle(undefined, undefined)).toBe('normal');
  });
});
