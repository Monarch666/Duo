'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
  retry,
}: {
  error: unknown;
  reset?: () => void;
  retry?: () => void;
}) {
  useEffect(() => {
    console.error('Sanctuary error:', error);
  }, [error]);

  const handleRecover = () => {
    if (typeof retry === 'function') {
      retry();
    } else if (typeof reset === 'function') {
      reset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#2C221E] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#EBD7C2] shadow-sm p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF6EF] border border-[#EBD7C2] flex items-center justify-center text-xl">
          🦦
        </div>
        <h2 className="text-xl font-serif font-semibold text-[#2C221E]">
          Something went quiet
        </h2>
        <p className="text-sm text-[#7D6B5D] leading-relaxed">
          We encountered an issue loading this section. Please try refreshing.
        </p>
        <div className="pt-2">
          <button
            onClick={handleRecover}
            type="button"
            className="px-5 py-2.5 bg-[#8E4A49] text-white rounded-xl text-sm font-medium hover:bg-[#783E3D] transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
