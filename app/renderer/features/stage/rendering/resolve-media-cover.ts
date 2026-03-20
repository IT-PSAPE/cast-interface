interface MediaCoverRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function resolveMediaCover(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number): MediaCoverRect | null {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) return null;

  const sourceAspectRatio = sourceWidth / sourceHeight;
  const targetAspectRatio = targetWidth / targetHeight;

  if (Math.abs(sourceAspectRatio - targetAspectRatio) < 0.0001) {
    return {
      x: 0,
      y: 0,
      width: sourceWidth,
      height: sourceHeight,
    };
  }

  if (sourceAspectRatio > targetAspectRatio) {
    const cropWidth = sourceHeight * targetAspectRatio;
    const cropX = (sourceWidth - cropWidth) / 2;

    return {
      x: cropX,
      y: 0,
      width: cropWidth,
      height: sourceHeight,
    };
  }

  const cropHeight = sourceWidth / targetAspectRatio;
  const cropY = (sourceHeight - cropHeight) / 2;

  return {
    x: 0,
    y: cropY,
    width: sourceWidth,
    height: cropHeight,
  };
}
