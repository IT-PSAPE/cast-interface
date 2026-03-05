import { useEffect, useState } from 'react';

export function useKImage(src: string | null): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    const nextImage = new Image();
    nextImage.crossOrigin = 'anonymous';
    nextImage.src = src;

    function handleLoad() {
      setImage(nextImage);
    }

    nextImage.addEventListener('load', handleLoad);
    if (nextImage.complete) setImage(nextImage);

    return () => {
      nextImage.removeEventListener('load', handleLoad);
    };
  }, [src]);

  return image;
}
