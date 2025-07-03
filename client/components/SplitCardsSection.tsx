"use client";
import { motion } from "framer-motion";

export default function SplitCardsSection() {
  return (
    <div className="flex flex-col md:flex-row h-full w-full gap-4 items-stretch">
      {/* Left Card */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className="flex-1 h-full bg-white/90 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden"
        style={{ minWidth: 0 }}
      >
        <img
          src="/card1.png"
          alt="Card 1"
          className="object-cover w-full h-full"
        />

      </motion.div>

      {/* Right Card */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className="flex-1 h-full bg-white/90 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden"
        style={{ minWidth: 0 }}
      >
        <img
          src="/card2.png"
          alt="Card 2"
          className="object-cover w-full h-full"
        />

      </motion.div>
    </div>
  );
}
