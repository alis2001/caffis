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
      className="relative w-full bg-apple-mesh py-16 overflow-hidden"
    >
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-pink-900/5 to-blue-900/10" />
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 backdrop-blur-sm"
            style={{
              width: `${60 + i * 20}px`,
              height: `${60 + i * 20}px`,
              left: `${20 + i * 20}%`,
              top: `${10 + i * 15}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              x: [-5, 5, -5],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
          
          {/* Branding Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center md:text-left"
          >
            <div className="flex items-center justify-center md:justify-start mb-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-4 shadow-lg">
                <Coffee className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Caffis
                </h3>
                <p className="text-sm text-gray-600">Connettiti con un caffè</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              La piattaforma social che connette persone autentiche attraverso l'amore condiviso per il caffè e le conversazioni genuine.
            </p>
            
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-600">Torino, Italia</span>
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
            <h4 className="text-xl font-bold text-gray-900 mb-6">Link Utili</h4>
            <div className="space-y-3">
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
                  className="block text-gray-600 hover:text-purple-600 transition-colors duration-200 hover:translate-x-2 transform"
                  whileHover={{ scale: 1.05 }}
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
            <h4 className="text-xl font-bold text-gray-900 mb-6">Seguici</h4>
            
            {/* Social Icons */}
            <div className="flex justify-center md:justify-end gap-4 mb-8">
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
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${social.color} flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon size={20} />
                </motion.a>
              ))}
            </div>

            {/* Newsletter */}
            <div className="card-apple bg-gradient-to-br from-purple-50 to-pink-50 p-6 mb-6">
              <h5 className="font-semibold text-gray-900 mb-3">Newsletter</h5>
              <p className="text-sm text-gray-600 mb-4">
                Ricevi aggiornamenti sui nuovi caffè partner e eventi esclusivi
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="La tua email"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="btn-apple-base btn-primary px-4 py-2 text-sm">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main CTA */}
            <motion.a
              href="/register"
              className="btn-apple-base btn-primary px-8 py-4 text-lg shadow-xl inline-flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Coffee className="w-5 h-5" />
              Unisciti Ora
            </motion.a>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 pt-8 border-t border-white/20 text-center"
        >
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            Made with <Heart className="w-4 h-4 text-red-500" /> in Torino
            <span className="mx-2">•</span>
            Connecting people one coffee at a time
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}