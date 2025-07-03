"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  text: string;
  index: number;
}

export default function FeatureCard({ icon, title, text, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="bg-white/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm flex flex-col items-center text-center space-y-4"
    >
      <div className="text-5xl">{icon}</div>
      <h3 className="text-xl font-bold tracking-wide text-brand-coral">{title}</h3>
      <p className="text-sm leading-relaxed">{text}</p>
    </motion.div>
  );
}
