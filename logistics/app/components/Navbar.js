"use client";

import React, { useState , useEffect} from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react"; // Import signOut
import AccountMenu from "./AccountMenu";
import { useRouter } from "next/navigation";


const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
);


const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      router.replace("/admin");
    }
  }, [session, router]);

  return (
    // The nav container needs a z-index to establish a stacking context for the mobile menu.
    <nav className="text-white p-4 flex justify-between items-center relative z-50">
      <div className="flex gap-4 items-center">
        <Image src="/assets/logo.png" alt="Logo" width={40} height={40} />
        <Link href="/" className="text-2xl sm:text-3xl font-bold">Logistique</Link>
      </div>

      {/* Desktop Menu: Unchanged, as it works correctly. */}
      <ul className="hidden md:flex space-x-4 gap-4 items-center text-lg">
        {!session ? (
          <>
            <li><Link href="/about" className="hover:text-gray-300 transition-colors">About</Link></li>
            <li><Link href="/contact" className="hover:text-gray-300 transition-colors">Contact</Link></li>
            <li><Link href="/login" className="hover:text-gray-300 transition-colors">Log in</Link></li>
            <li>
              <Link href="/signup" className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-md transition-colors">
                Sign Up
              </Link>
            </li>
          </>
        ) : (
          <li><AccountMenu /></li>
        )}
      </ul>

      {/* Hamburger Menu Button: Visible only on small screens */}
      <div className="md:hidden">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>


      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-black bg-opacity-95 backdrop-blur-sm shadow-lg z-50">
          <ul className="flex flex-col items-center space-y-6 py-8 text-xl">
            {!session ? (
              // --- Logged Out View ---
              <>
                <li><Link href="/about" onClick={() => setIsMenuOpen(false)}>About</Link></li>
                <li><Link href="/contact" onClick={() => setIsMenuOpen(false)}>Contact</Link></li>
                <li><Link href="/login" onClick={() => setIsMenuOpen(false)}>Log in</Link></li>
                <li>
                  <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="bg-green-500 hover:bg-green-600 px-5 py-2.5 rounded-md transition-colors">
                    Sign Up
                  </Link>
                </li>
              </>
            ) : (
              // --- Logged In View ---
              <>
                <li><Link href="/order-history" onClick={() => setIsMenuOpen(false)}>Order History</Link></li>
                <li><Link href="/" onClick={() => setIsMenuOpen(false)}>My Profile</Link></li>
                <li>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false); // Close menu first
                      signOut(); // Then sign out
                    }}
                    className="text-red-400 hover:text-red-500 font-semibold transition-colors"
                  >
                    Sign Out
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}
