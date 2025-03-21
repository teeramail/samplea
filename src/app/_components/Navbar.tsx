"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-purple-900 to-purple-800 border-b border-purple-900">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <Link href="/" className="flex items-center space-x-3">
          <span className="self-center text-2xl font-semibold whitespace-nowrap text-white">
            <span className="text-red-400">Thai</span>Boxing<span className="text-red-400">Hub</span>
          </span>
        </Link>
        
        <button 
          type="button" 
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-200 rounded-lg md:hidden hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="sr-only">Open main menu</span>
          <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
          </svg>
        </button>
        
        <div className={`${isMenuOpen ? 'block' : 'hidden'} w-full md:block md:w-auto`}>
          <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-purple-700 rounded-lg bg-purple-800 md:space-x-8 md:flex-row md:mt-0 md:border-0 md:bg-transparent">
            <li>
              <Link 
                href="/" 
                className={`block py-2 px-3 rounded md:p-0 ${isActive('/') 
                  ? 'text-white bg-purple-700 md:bg-transparent md:text-red-400' 
                  : 'text-white hover:bg-purple-700 md:hover:bg-transparent md:hover:text-red-300'}`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                href="/events" 
                className={`block py-2 px-3 rounded md:p-0 ${isActive('/events') 
                  ? 'text-white bg-purple-700 md:bg-transparent md:text-red-400' 
                  : 'text-white hover:bg-purple-700 md:hover:bg-transparent md:hover:text-red-300'}`}
              >
                Events
              </Link>
            </li>
            <li>
              <Link 
                href="/regions" 
                className={`block py-2 px-3 rounded md:p-0 ${isActive('/regions') 
                  ? 'text-white bg-purple-700 md:bg-transparent md:text-red-400' 
                  : 'text-white hover:bg-purple-700 md:hover:bg-transparent md:hover:text-red-300'}`}
              >
                Regions
              </Link>
            </li>
            <li>
              <Link 
                href="/fighters" 
                className={`block py-2 px-3 rounded md:p-0 ${isActive('/fighters') 
                  ? 'text-white bg-purple-700 md:bg-transparent md:text-red-400' 
                  : 'text-white hover:bg-purple-700 md:hover:bg-transparent md:hover:text-red-300'}`}
              >
                Fighters
              </Link>
            </li>
            <li>
              <Link 
                href="/venues" 
                className={`block py-2 px-3 rounded md:p-0 ${isActive('/venues') 
                  ? 'text-white bg-purple-700 md:bg-transparent md:text-red-400' 
                  : 'text-white hover:bg-purple-700 md:hover:bg-transparent md:hover:text-red-300'}`}
              >
                Venues
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
} 