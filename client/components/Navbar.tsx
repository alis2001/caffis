"use client";

import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-black/20">
      {/* Left: Just the large logo */}
      <Link href="/">
        <Image
          src="/favicon.png" // Make sure this file exists in /public
          alt="Caffis logo"
          width={60}
          height={60}
          className="rounded-md"
        />
      </Link>

      {/* Right: Navigation Links */}
      <div className="flex space-x-10 text-white font-semibold text-sm drop-shadow-lg">
        {["Home", "Register", "Login"].map((label, i) => (
          <Link
            key={i}
            href={label === "Home" ? "/" : `/${label.toLowerCase()}`}
            className="relative group transition duration-300"
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
