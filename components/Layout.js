import { useState } from 'react';
import Footer from './Footer';
import { FiSmartphone, FiTablet } from 'react-icons/fi';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/*
        ───────────────────────────────
        MOBILE VIEW (< md)
        ───────────────────────────────
      */}
      <div className="block md:hidden flex-1 flex flex-col items-center justify-center bg-white p-6 text-center">
        {/* Icon */}
        <FiSmartphone className="text-6xl text-gray-400 mb-4" />
        {/* Masai Logo */}
        <img
          src="/images/masai-logo.svg"
          alt="Masai Logo"
          className="h-14 mb-4 ml-auto"
        />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Mobile View Under Development
        </h2>
        <p className="text-gray-600">
          Please switch to a desktop device.
        </p>
      </div>

      {/*
        ───────────────────────────────
        TABLET VIEW (≥ md and < lg)
        ───────────────────────────────
      */}
      <div className="hidden md:flex lg:hidden flex-1 flex-col items-center justify-center bg-white p-6 text-center">
        {/* Icon */}
        <FiTablet className="text-6xl text-gray-400 mb-4" />
        {/* Masai Logo */}
        <img
          src="/images/masai-logo.svg"
          alt="Masai Logo"
          className="h-14 mb-4 ml-auto"
        />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Tablet View Under Development
        </h2>
        <p className="text-gray-600">
          Please switch to a desktop device.
        </p>
      </div>

      {/*
        ───────────────────────────────
        DESKTOP VIEW (≥ lg)
        Your Normal Layout
        ───────────────────────────────
      */}
      <div className="hidden lg:flex flex-col min-h-screen w-full bg-white">
        <main className="flex-grow w-full">
          {children}
        </main>
      </div>

      {/* Footer - Always visible */}
      <Footer />
    </div>
  );
}