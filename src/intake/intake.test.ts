import { describe, expect, it } from 'vitest';
import { mediaTypeFromPath } from './intake';

describe('mediaTypeFromPath()', () => {
  it.for([
    ['image.jpg', 'image/jpeg'],
    ['pizza.jpeg', 'image/jpeg'],
    ['apple-pie.png', 'image/png'],
    ['tabbouleh.webp', 'image/webp'],
    ['tom-yum.gif', 'image/gif']
  ])(
    'mediaTypeFromPath correctly maps %s to %s mediaType',
    ([fileName, mediaType]) => {
      expect(mediaTypeFromPath(fileName)).toBe(mediaType);
    }
  );

  it('should throw when a file is added with an unsupported extension (eg.: .bmp)', () => {
    expect(() => mediaTypeFromPath('greek-salad.bmp')).toThrow(
      'Unsupported image extension: .bmp'
    );
  });
});
