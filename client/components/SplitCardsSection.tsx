"use client";
import { motion } from "framer-motion";

export default function SplitCardsSection() {
  return (
    <div className="flex flex-col md:flex-row h-full w-full gap-6 items-stretch p-6">
      {/* Left Card */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="flex-1 h-full card-apple bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center text-center overflow-hidden relative"
        style={{ minWidth: 0 }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-gradient-to-r from-purple-400 to-pink-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-gradient-to-r from-pink-400 to-blue-400"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-8xl mb-6"
          >
            🎯
          </motion.div>
          <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            Smart Matching
          </h3>
          <p className="text-gray-700 leading-relaxed text-lg">
            Il nostro algoritmo AI analizza le tue preferenze per trovare compagni di caffè compatibili nella tua zona.
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">95%</div>
              <div className="text-sm text-gray-600">Match Success</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">2.3s</div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Card */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="flex-1 h-full card-apple bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-center text-center overflow-hidden relative"
        style={{ minWidth: 0 }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-28 h-28 rounded-full bg-gradient-to-r from-pink-400 to-orange-500"></div>
          <div className="absolute bottom-10 left-10 w-36 h-36 rounded-full bg-gradient-to-r from-orange-400 to-yellow-500"></div>
          <div className="absolute top-1/3 left-1/3 w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-pink-500"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-8xl mb-6"
          >
            ☕
          </motion.div>
          <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-orange-600 mb-4">
            Coffee Connections
          </h3>
          <p className="text-gray-700 leading-relaxed text-lg">
            Organizza incontri spontanei nei migliori caffè della tua città. Nessuna pressione, solo conversazioni autentiche.
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">1.2K+</div>
              <div className="text-sm text-gray-600">Coffee Shops</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">24/7</div>
              <div className="text-sm text-gray-600">Availability</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}