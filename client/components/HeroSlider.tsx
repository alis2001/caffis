"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
const images = ["/hero1.jpg", "/hero2.jpg", "/hero3.jpg"];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Slides */}
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={`Hero ${index}`}
          fill
          priority={index === 0}
          className={`absolute inset-0 object-cover transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100 z-0" : "opacity-0"
          }`}
        />
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 z-10" />

      {/* Foreground Content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-6">
        <h1 className="text-5xl md:text-7xl font-extrabold drop-shadow-lg tracking-tight">
          Caffis
        </h1>
        <p className="mt-4 text-xl md:text-2xl font-medium max-w-xl drop-shadow-sm">
          Spontaneous coffee meetups. One tap away.
        </p>
        <Link
            href="/register"
            className="mt-8 px-8 py-3 bg-[#6BBF59] text-white font-semibold rounded-full shadow-xl hover:scale-105 transition duration-300"
            >
            Join Now
        </Link>

      </div>
    </div>
  );
}
