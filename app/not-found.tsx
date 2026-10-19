import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B0F] text-slate-100 px-4 text-center">
      <h1 className="text-6xl font-black text-[#E50914] mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-slate-400 max-w-md mb-6 text-sm">
        The video or page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-[#E50914] hover:bg-[#b80710] text-white font-medium rounded-lg transition-colors text-sm"
      >
        Return to Home
      </Link>
    </div>
  );
}
