"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isLightPage = pathname === "/register" || pathname === "/login";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md ${
      isLightPage ? "bg-white/70 text-gray-800" : "bg-black/20 text-white"
    } transition-colors duration-300`}>
      {/* Left: Logo */}
      <Link href="/">
        <Image
          src="/favicon.png"
          alt="Caffis logo"
          width={60}
          height={60}
          className="rounded-md"
        />
      </Link>

      {/* Right: Navigation Links */}
      <div className="flex space-x-10 font-semibold text-sm drop-shadow-lg">
        {["Home", "Register", "Login"].map((label, i) => (
          <Link
            key={i}
            href={label === "Home" ? "/" : `/${label.toLowerCase()}`}
            className="relative group transition duration-300 hover:opacity-80"
          >
            <span className="group-hover:underline group-hover:underline-offset-4">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
