"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageWithFallbackProps {
  src: string | null;
  alt: string;
  fallbackSrc: string;
  className?: string;
  rounded?: boolean;
  width?: number;
  height?: number;
}

export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc,
  className = "",
  rounded = false,
  width = 100,
  height = 100,
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string>(src ?? fallbackSrc);
  const [error, setError] = useState(false);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={`${className} ${rounded ? "rounded-full" : ""}`}
      onError={() => {
        if (!error) {
          setImgSrc(fallbackSrc);
          setError(true);
        }
      }}
      style={{ objectFit: "cover" }}
    />
  );
}
