"use client";

import { Instagram, Linkedin, Twitter, Coffee, Heart, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
      className="relative w-full h-full flex items-center justify-center py-8 overflow-hidden"
    >
      {/* Floating Background Elements - More Subtle */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-purple-400/10 to-pink-400/10"
            style={{
              width: `${40 + i * 10}px`,
              height: `${40 + i * 10}px`,
              left: `${20 + i * 20}%`,
              top: `${20 + i * 15}%`,
            }}
            animate={{
              y: [-5, 5, -5],
              x: [-3, 3, -3],
              scale: [1, 1.05, 1],
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
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Branding Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center md:text-left"
          >
            <div className="flex items-center justify-center md:justify-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3 shadow-lg">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Caffis
                </h3>
                <p className="text-xs text-gray-600">Connettiti con un caffè</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4 leading-relaxed text-sm">
              La piattaforma social che connette persone autentiche attraverso l'amore condiviso per il caffè.
            </p>
            
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <MapPin className="w-3 h-3 text-purple-500" />
              <span className="text-xs text-gray-600">Torino, Italia</span>
            </div>
            
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Caffis. Tutti i diritti riservati.
            </p>
          </motion.div>

          {/* Links Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center md:text-left"
          >
            <h4 className="text-lg font-bold text-gray-900 mb-4">Link Utili</h4>
            <div className="space-y-2">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Termini di Servizio", href: "/terms" },
                { label: "Contattaci", href: "/contact" },
                { label: "Chi Siamo", href: "/about" },
                { label: "FAQ", href: "/faq" },
                { label: "Blog", href: "/blog" }
              ].map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  className="block text-gray-600 hover:text-purple-600 transition-colors duration-200 text-sm hover:translate-x-1 transform"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {link.label}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Social & CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center md:text-right"
          >
            <h4 className="text-lg font-bold text-gray-900 mb-4">Seguici</h4>
            
            {/* Social Icons */}
            <div className="flex justify-center md:justify-end gap-3 mb-6">
              {[
                { icon: Instagram, href: "https://instagram.com/caffis", color: "from-pink-500 to-purple-500" },
                { icon: Linkedin, href: "https://linkedin.com/company/caffis", color: "from-blue-500 to-blue-600" },
                { icon: Twitter, href: "https://twitter.com/caffis", color: "from-blue-400 to-blue-500" }
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-xl bg-gradient-to-r ${social.color} flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon size={16} />
                </motion.a>
              ))}
            </div>

            {/* Newsletter - Compact */}
            <div className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-sm p-4 rounded-xl mb-4 border border-purple-100/50">
              <h5 className="font-semibold text-gray-900 mb-2 text-sm">Newsletter</h5>
              <p className="text-xs text-gray-600 mb-3">
                Ricevi aggiornamenti sui nuovi caffè partner
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="La tua email"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-lg hover:scale-105 transition-transform">
                  <Heart className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Main CTA */}
            <motion.a
              href="/register"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg inline-flex items-center gap-2 hover:scale-105 transition-transform text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Coffee className="w-4 h-4" />
              Unisciti Ora
            </motion.a>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 pt-6 border-t border-gray-200/50 text-center"
        >
          <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
            Made with <Heart className="w-3 h-3 text-red-500" /> in Torino
            <span className="mx-2">•</span>
            Connecting people one coffee at a time
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}