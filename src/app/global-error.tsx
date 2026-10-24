'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAF6EF] text-[#2C221E] min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#EBD7C2] shadow-sm p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF6EF] border border-[#EBD7C2] flex items-center justify-center text-xl">
            🦦
          </div>
          <h2 className="text-xl font-serif font-semibold text-[#2C221E]">
            Something unexpected occurred
          </h2>
          <p className="text-sm text-[#7D6B5D] leading-relaxed">
            Your intimate sanctuary ran into a temporary issue. Your shared data remains safe and preserved.
          </p>
          <div className="pt-2">
            <button
              onClick={() => reset()}
              type="button"
              className="px-5 py-2.5 bg-[#8E4A49] text-white rounded-xl text-sm font-medium hover:bg-[#783E3D] transition-colors shadow-sm"
            >
              Reload Sanctuary
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
