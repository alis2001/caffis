"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLightPage = pathname === "/register" || pathname === "/login";

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

  // Guest navigation (not logged in)
  const GuestNavigation = () => (
    <div className="flex space-x-6 font-semibold text-sm">
      <Link
        href="/"
        className={`relative group transition duration-300 hover:opacity-80 ${
          pathname === "/" ? "border-b-2 border-current" : ""
        }`}
      >
        <span className="group-hover:underline group-hover:underline-offset-4">
          Home
        </span>
      </Link>
      <Link
        href="/register"
        className={`relative group transition duration-300 hover:opacity-80 ${
          pathname === "/register" ? "border-b-2 border-current" : ""
        }`}
      >
        <span className="group-hover:underline group-hover:underline-offset-4">
          Registrati
        </span>
      </Link>
      <Link
        href="/login"
        className={`relative group transition duration-300 hover:opacity-80 ${
          pathname === "/login" ? "border-b-2 border-current" : ""
        }`}
      >
        <span className="group-hover:underline group-hover:underline-offset-4">
          Accedi
        </span>
      </Link>
    </div>
  );

  // Authenticated navigation (logged in)
  const AuthenticatedNavigation = () => (
    <div className="flex items-center space-x-6">
      {/* Navigation Links */}
      <div className="hidden md:flex space-x-6 font-semibold text-sm">
        <Link
          href="/dashboard"
          className={`relative group transition duration-300 hover:opacity-80 ${
            pathname === "/dashboard" ? "border-b-2 border-current" : ""
          }`}
        >
          <span className="group-hover:underline group-hover:underline-offset-4">
            Dashboard
          </span>
        </Link>
        <Link
          href="/invites"
          className={`relative group transition duration-300 hover:opacity-80 ${
            pathname === "/invites" ? "border-b-2 border-current" : ""
          }`}
        >
          <span className="group-hover:underline group-hover:underline-offset-4">
            Eventi
          </span>
        </Link>
        <Link
          href="/create-invite"
          className={`relative group transition duration-300 hover:opacity-80 ${
            pathname === "/create-invite" ? "border-b-2 border-current" : ""
          }`}
        >
          <span className="group-hover:underline group-hover:underline-offset-4">
            Crea Evento
          </span>
        </Link>
      </div>

      {/* User Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 hover:bg-white/20 transition duration-200"
        >
          {/* User Avatar */}
          <div className="w-8 h-8 bg-[#6BBF59] rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.profilePic ? (
              <Image
                src={user.profilePic}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              getUserInitials()
            )}
          </div>
          
          {/* User Name (hidden on mobile) */}
          <span className="hidden sm:block font-medium text-sm">
            {user?.firstName}
          </span>
          
          {/* Dropdown Arrow */}
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              showUserMenu ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#6BBF59] rounded-full flex items-center justify-center text-white font-bold">
                  {user?.profilePic ? (
                    <Image
                      src={user.profilePic}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    getUserInitials()
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">@{user?.username}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {user?.isEmailVerified && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">
                        ✓ Email
                      </span>
                    )}
                    {user?.isPhoneVerified && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">
                        ✓ Telefono
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* Mobile Navigation Links */}
              <div className="md:hidden border-b border-gray-100 pb-2 mb-2">
                <Link
                  href="/dashboard"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  href="/invites"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Eventi
                </Link>
                <Link
                  href="/create-invite"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowUserMenu(false)}
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crea Evento
                </Link>
              </div>

              {/* Profile & Settings */}
              <Link
                href="/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowUserMenu(false)}
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profilo
              </Link>
              
              <Link
                href="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowUserMenu(false)}
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Impostazioni
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Esci
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md ${
      isLightPage ? "bg-white/70 text-gray-800" : "bg-black/20 text-white"
    } transition-colors duration-300`}>
      {/* Left: Logo */}
      <Link href={isAuthenticated ? "/dashboard" : "/"}>
        <Image
          src="/favicon.png"
          alt="Caffis logo"
          width={60}
          height={60}
          className="rounded-md hover:scale-105 transition-transform duration-200"
        />
      </Link>

      {/* Right: Navigation */}
      {isLoading ? (
        // Loading state
        <div className="w-8 h-8 animate-pulse bg-white/20 rounded-full"></div>
      ) : isAuthenticated ? (
        <AuthenticatedNavigation />
      ) : (
        <GuestNavigation />
      )}
    </nav>
  );
}