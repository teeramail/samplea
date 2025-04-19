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
    <nav className="border-b border-purple-900 bg-gradient-to-r from-purple-900 to-purple-800">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">
        <Link href="/" className="flex items-center space-x-3">
          <span className="self-center whitespace-nowrap text-2xl font-semibold text-white">
            <span className="text-red-400">Thai</span>Boxing
            <span className="text-red-400">Hub</span>
          </span>
        </Link>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg p-2 text-sm text-gray-200 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="h-5 w-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 17 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 1h15M1 7h15M1 13h15"
            />
          </svg>
        </button>

        <div
          className={`${isMenuOpen ? "block" : "hidden"} w-full md:block md:w-auto`}
        >
          <ul className="mt-4 flex flex-col rounded-lg border border-purple-700 bg-purple-800 p-4 font-medium md:mt-0 md:flex-row md:space-x-8 md:border-0 md:bg-transparent md:p-0">
            <li>
              <Link
                href="/"
                className={`block rounded px-3 py-2 md:p-0 ${
                  isActive("/")
                    ? "bg-purple-700 text-white md:bg-transparent md:text-red-400"
                    : "text-white hover:bg-purple-700 md:hover:bg-transparent md:hover:text-red-300"
                }`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/events"
                className={`block rounded px-3 py-2 md:p-0 ${
                  isActive("/events")
                    ? "bg-purple-700 text-white md:bg-transparent md:text-red-400"
                    : "text-white hover:bg-purple-700 md:hover:bg-transparent md:hover:text-red-300"
                }`}
              >
                Events
              </Link>
            </li>
            <li>
              <Link
                href="/regions"
                className={`block rounded px-3 py-2 md:p-0 ${
                  isActive("/regions")
                    ? "bg-purple-700 text-white md:bg-transparent md:text-red-400"
                    : "text-white hover:bg-purple-700 md:hover:bg-transparent md:hover:text-red-300"
                }`}
              >
                Regions
              </Link>
            </li>
            <li>
              <Link
                href="/fighters"
                className={`block rounded px-3 py-2 md:p-0 ${
                  isActive("/fighters")
                    ? "bg-purple-700 text-white md:bg-transparent md:text-red-400"
                    : "text-white hover:bg-purple-700 md:hover:bg-transparent md:hover:text-red-300"
                }`}
              >
                Fighters
              </Link>
            </li>
            <li>
              <Link
                href="/venues"
                className={`block rounded px-3 py-2 md:p-0 ${
                  isActive("/venues")
                    ? "bg-purple-700 text-white md:bg-transparent md:text-red-400"
                    : "text-white hover:bg-purple-700 md:hover:bg-transparent md:hover:text-red-300"
                }`}
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
