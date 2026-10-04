import React from 'react';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white text-center font-sans antialiased">
      <style>{`
        @keyframes reactLogoSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <header className="bg-[#222222] text-white flex flex-col items-center justify-center py-16 px-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="-11.5 -10.23174 23 20.46348"
          className="w-20 h-20 mb-6"
          style={{ animation: 'reactLogoSpin infinite 20s linear' }}
        >
          <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
          <g stroke="#61dafb" strokeWidth="1" fill="none">
            <ellipse rx="11" ry="4.2" />
            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
          </g>
        </svg>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-white">
          Welcome to React
        </h1>
      </header>

      <main className="py-10 px-4">
        <p className="text-base sm:text-lg text-black">
          To get started, edit <code className="font-mono bg-transparent text-black text-[0.95em]">src/App.js</code> and save to reload.
        </p>
      </main>
    </div>
  );
}
