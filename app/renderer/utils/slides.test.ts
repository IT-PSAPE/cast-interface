import { describe, expect, it } from 'vitest';
import { castMediaSrc } from './slides';

describe('castMediaSrc', () => {
  it('encodes absolute file paths into cast-media protocol URLs', () => {
    const src = castMediaSrc('/Users/Craig/Media/welcome slide.png');
    expect(src).toBe('cast-media://%2FUsers%2FCraig%2FMedia%2Fwelcome%20slide.png');
  });
});
