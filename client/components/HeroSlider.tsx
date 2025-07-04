"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const slides = [
  {
    title: "Connettiti con un Caffè",
    subtitle: "Spontaneous coffee meetups. One tap away.",
    gradient: "from-purple-400 via-pink-500 to-red-500",
    emoji: "☕"
  },
  {
    title: "Trova la Tua Tribù",
    subtitle: "Discover amazing people in your neighborhood.",
    gradient: "from-blue-400 via-purple-500 to-pink-500",
    emoji: "👥"
  },
  {
    title: "Esperienze Autentiche",
    subtitle: "Real connections over genuine conversations.",
    gradient: "from-green-400 via-blue-500 to-purple-500",
    emoji: "🌟"
  }
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 bg-apple-mesh">
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${slides[current].gradient} opacity-40`}
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm"
            style={{
              left: `${10 + (i * 15)}%`,
              top: `${20 + (i * 10)}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Logo/Brand */}
          <motion.div
            className="mb-8"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 drop-shadow-2xl tracking-tight">
              Caffis
            </h1>
          </motion.div>

          {/* Dynamic Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="text-6xl mb-4">{slides[current].emoji}</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">
                {slides[current].title}
              </h2>
              <p className="text-xl md:text-2xl text-white/90 drop-shadow-md max-w-2xl mx-auto">
                {slides[current].subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/register"
              className="btn-apple-base btn-primary px-8 py-4 text-lg shadow-2xl backdrop-blur-md hover:scale-105 transition-transform"
            >
              <span className="text-2xl mr-2">🚀</span>
              Join Now
            </Link>
            <button className="btn-apple-base bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 px-8 py-4 text-lg hover:scale-105 transition-transform">
              <span className="text-2xl mr-2">✨</span>
              Learn More
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === current 
                ? 'bg-white shadow-lg scale-125' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent z-10" />
    </div>
  );
}