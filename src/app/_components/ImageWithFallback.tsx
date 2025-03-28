'use client';

import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string | null;
  alt: string;
  fallbackSrc: string;
  className?: string;
  rounded?: boolean;
}

export default function ImageWithFallback({
  src, 
  alt, 
  fallbackSrc,
  className = '',
  rounded = false
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
  const [hasError, setHasError] = useState<boolean>(!src);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`${className} ${rounded ? 'rounded-full' : ''}`}
      onError={() => {
        setImgSrc(fallbackSrc);
        setHasError(true);
      }}
    />
  );
} 