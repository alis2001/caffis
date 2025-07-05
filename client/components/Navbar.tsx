"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, User, Settings, 
  LogOut, Shield, Menu, X, Grid3X3, Plus
} from "lucide-react";
import CaffisLogo from "@/components/CaffisLogo";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLightPage = pathname === "/register" || pathname === "/login";

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  // Guest navigation (not logged in) with Apple design
  const GuestNavigation = () => (
    <div className="flex space-x-3">
      <Link href="/">
        <motion.div
          className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all relative overflow-hidden ${
            pathname === "/"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
              : "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-current"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Liquid Glass Effect for Active State */}
          {pathname === "/" && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ width: "50%" }}
            />
          )}
          <span className="relative z-10">Home</span>
        </motion.div>
      </Link>
      
      <Link href="/register">
        <motion.div
          className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all relative overflow-hidden ${
            pathname === "/register"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
              : "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-current"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Liquid Glass Effect for Active State */}
          {pathname === "/register" && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ width: "50%" }}
            />
          )}
          <span className="relative z-10">Registrati</span>
        </motion.div>
      </Link>
      
      <Link href="/login">
        <motion.div
          className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all relative overflow-hidden ${
            pathname === "/login"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
              : "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-current"
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Liquid Glass Effect for Active State */}
          {pathname === "/login" && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ width: "50%" }}
            />
          )}
          <span className="relative z-10">Accedi</span>
        </motion.div>
      </Link>
    </div>
  );

  // Authenticated navigation (logged in) with Apple design
  const AuthenticatedNavigation = () => (
    <div className="flex items-center space-x-4">
      {/* Navigation Links */}
      <div className="hidden md:flex space-x-3">
        <Link href="/dashboard">
          <motion.div
            className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all relative overflow-hidden ${
              pathname === "/dashboard"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                : "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-current"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Liquid Glass Effect for Active State */}
            {pathname === "/dashboard" && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ width: "50%" }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2">
              <Grid3X3 size={16} />
              <span>Dashboard</span>
            </div>
          </motion.div>
        </Link>
        
        <Link href="/invites">
          <motion.div
            className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all relative overflow-hidden ${
              pathname === "/invites"
                ? "bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg"
                : "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-current"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Liquid Glass Effect for Active State */}
            {pathname === "/invites" && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ width: "50%" }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2">
              <Calendar size={16} />
              <span>Eventi</span>
            </div>
          </motion.div>
        </Link>
        
        <Link href="/create-invite">
          <motion.div
            className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all relative overflow-hidden ${
              pathname === "/create-invite"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                : "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-current"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Liquid Glass Effect for Active State */}
            {pathname === "/create-invite" && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ width: "50%" }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2">
              <Plus size={16} />
              <span>Crea Evento</span>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* User Menu */}
      <div className="relative" ref={menuRef}>
        <motion.button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-2xl px-3 py-2 hover:bg-white/20 transition-all shadow-lg border border-white/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* User Avatar */}
          <motion.div 
            className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-sm font-bold overflow-hidden"
            whileHover={{ rotate: 5 }}
          >
            {user?.profilePic ? (
              <Image
                src={user.profilePic}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-xl object-cover"
              />
            ) : (
              getUserInitials()
            )}
            
            {/* Online Status */}
            <motion.div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
          
          {/* User Name */}
          <span className="hidden sm:block font-medium text-sm">
            {user?.firstName}
          </span>
          
          {/* Dropdown Arrow */}
          <motion.svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: showUserMenu ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </motion.button>

        {/* Dropdown Menu with Apple Design */}
        <AnimatePresence>
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-3 w-72 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50"
            >
              {/* User Info Header */}
              <div className="px-4 py-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-gray-100/50">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                    {user?.profilePic ? (
                      <Image
                        src={user.profilePic}
                        alt="Profile"
                        width={48}
                        height={48}
                        className="rounded-2xl object-cover"
                      />
                    ) : (
                      getUserInitials()
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">@{user?.username}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {user?.isEmailVerified && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Shield size={10} />
                          Email
                        </span>
                      )}
                      {user?.isPhoneVerified && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          📱 Telefono
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {/* Mobile Navigation Links */}
                <div className="md:hidden border-b border-gray-100/50 pb-2 mb-2">
                  <Link
                    href="/dashboard"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-white/50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Grid3X3 className="w-4 h-4 mr-3 text-blue-500" />
                    Dashboard
                  </Link>
                  <Link
                    href="/invites"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-white/50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Calendar className="w-4 h-4 mr-3 text-pink-500" />
                    Eventi
                  </Link>
                  <Link
                    href="/create-invite"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-white/50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Plus className="w-4 h-4 mr-3 text-purple-500" />
                    Crea Evento
                  </Link>
                </div>

                {/* Profile & Settings */}
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-white/50 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4 mr-3 text-blue-500" />
                  Profilo
                </Link>
                
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-white/50 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4 mr-3 text-gray-500" />
                  Impostazioni
                </Link>

                {/* Logout */}
                <div className="border-t border-gray-100/50 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50/50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Esci
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-500 ${
        isLightPage 
          ? scrolled 
            ? "bg-white/60 backdrop-blur-xl border-b border-gray-200/30 shadow-lg text-gray-800" 
            : "bg-white/50 backdrop-blur-md text-gray-800"
          : scrolled 
            ? "bg-black/10 backdrop-blur-xl border-b border-white/10 shadow-2xl text-white" 
            : "bg-black/5 backdrop-blur-md text-white"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: scrolled 
            ? "linear-gradient(90deg, rgba(102,126,234,0.08) 0%, rgba(240,147,251,0.08) 50%, rgba(75,172,254,0.08) 100%)"
            : "linear-gradient(90deg, rgba(102,126,234,0.04) 0%, rgba(240,147,251,0.04) 50%, rgba(75,172,254,0.04) 100%)"
        }}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="relative z-10 w-full flex items-center justify-between">
        {/* Left: Logo with Text */}
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex items-center gap-3"
          >
            {/* Clean Logo - No Background */}
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <CaffisLogo className="w-10 h-10" />
            </motion.div>
            
            {/* Brand Text with Updated Gradient */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">
                  Caffis
                </span>
              </h1>
              <p className="text-xs text-gray-600">
                Connetti con un caffè
              </p>
            </motion.div>
          </motion.div>
        </Link>

        {/* Right: Navigation */}
        {isLoading ? (
          // Loading state with Apple design
          <motion.div 
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <CaffisLogo className="w-5 h-5" />
          </motion.div>
        ) : isAuthenticated ? (
          <AuthenticatedNavigation />
        ) : (
          <GuestNavigation />
        )}
      </div>
    </motion.nav>
  );
}