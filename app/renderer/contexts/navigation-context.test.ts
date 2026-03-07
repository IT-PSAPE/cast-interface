import { describe, expect, it } from 'vitest';
import { resolveCurrentPresentationId } from './navigation-context';

describe('resolveCurrentPresentationId', () => {
  it('keeps null when nothing is selected', () => {
    expect(resolveCurrentPresentationId(null, ['p-1', 'p-2'])).toBeNull();
  });

  it('keeps selection when selected id still exists', () => {
    expect(resolveCurrentPresentationId('p-2', ['p-1', 'p-2'])).toBe('p-2');
  });

  it('clears selection when selected id no longer exists', () => {
    expect(resolveCurrentPresentationId('p-3', ['p-1', 'p-2'])).toBeNull();
  });
});
