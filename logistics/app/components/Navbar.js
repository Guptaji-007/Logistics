// app/components/Navbar.jsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import AccountMenu from "./AccountMenu";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="text-white p-4 flex justify-between items-center">
      <div className="flex gap-5">
        <Image className="mt-0.5" src="/assets/logo.png" alt="Logo" width={50} height={50} />
        <Link href="/" className="text-3xl mt-2 font-bold">Logistique</Link>
      </div>

      <ul className="flex space-x-4 gap-4 justify-between px-2 text-lg">
        {!session && (
          <>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/login">Log in</Link></li>
            <li><Link href="/signup">Sign Up</Link></li>
          </>
        )}
        {session && <li><AccountMenu /></li>}
      </ul>
    </nav>
  );
}
