import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Left - Logo */}
        <Link href="/" className="flex items-center">
          <img src="/images/masai-logo.svg" alt="Masai Logo" className="h-8 w-auto" />
        </Link>

        {/* Center - Search */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            {/* <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            /> */}
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Right - My Account */}
        <Link href="/account" className="text-gray-700 hover:text-gray-900">
          My Account
        </Link>
      </div>
    </nav>
  );
}