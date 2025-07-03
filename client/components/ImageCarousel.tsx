// components/ImageCarousel.tsx
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface Props {
  images: string[];
  interval?: number;
}

export default function ImageCarousel({ images, interval = 5000 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(id);
  }, [images, interval]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {images.map((img, i) => (
        <Image
          key={i}
          src={img}
          alt={`carousel-${i}`}
          fill
          className={`absolute object-cover transition-opacity duration-1000 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
