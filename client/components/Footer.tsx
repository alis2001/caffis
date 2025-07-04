"use client";

import { Instagram, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <motion.footer
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="relative w-full flex flex-col justify-end items-center bg-[#FDF8F3] text-gray-700 border-t border-gray-200 overflow-hidden pb-12 pt-10"
     >
      {/* ✅ Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Footerbackground.png"
          alt="Footer background"
          fill
          priority
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-white/40" />
      </div>

      {/* ✅ Foreground Content */}
      <div className="relative z-10 w-full max-w-7xl px-6 grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
        {/* Branding */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <Image
            src="/favicon.png"
            alt="Caffis logo"
            width={48}
            height={48}
            className="mb-3"
          />
          <h3 className="text-2xl font-bold text-brand-coral">Caffis</h3>
          <p className="text-sm mt-1 text-gray-500">Connettiti con un caffè.</p>
          <p className="text-xs mt-4 text-gray-400">
            © {new Date().getFullYear()} Caffis. Tutti i diritti riservati.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2 items-center md:items-start text-sm">
          <h4 className="text-base font-semibold mb-2">Link utili</h4>
          <a href="/privacy" className="hover:underline">Privacy</a>
          <a href="/terms" className="hover:underline">Termini</a>
          <a href="/contact" className="hover:underline">Contattaci</a>
        </div>

        {/* Socials + CTA */}
        <div className="flex flex-col items-center md:items-end gap-4">
          <h4 className="text-base font-semibold">Seguici</h4>
          <div className="flex gap-4 text-gray-500">
            <a href="https://instagram.com/yourapp" target="_blank" className="hover:text-brand-green transition">
              <Instagram size={20} />
            </a>
            <a href="https://linkedin.com/company/yourapp" target="_blank" className="hover:text-brand-green transition">
              <Linkedin size={20} />
            </a>
            <a href="https://twitter.com/yourapp" target="_blank" className="hover:text-brand-green transition">
              <Twitter size={20} />
            </a>
          </div>
          <a
            href="/register"
            className="mt-4 inline-block bg-[#6BBF59] text-white px-5 py-2 rounded-full text-sm font-medium shadow-md hover:scale-105 transition"
          >
            Unisciti ora
          </a>
        </div>
      </div>
    </motion.footer>
  );
}
