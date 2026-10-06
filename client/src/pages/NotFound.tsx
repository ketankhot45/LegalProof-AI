import React from 'react';
import { Link } from 'react-router';
import { ShieldAlert, ArrowLeft, Home, Search } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Footer } from '../components/Footer';
import { usePageSEO } from '../hooks/usePageSEO';

export const NotFound: React.FC = () => {
  usePageSEO({
    title: '404 – Page Not Found | LegalProof AI',
    description: 'The requested resource or page could not be located on the LegalProof AI platform.',
    canonicalPath: '/404',
    robots: 'noindex, nofollow',
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="focus:outline-hidden">
            <Logo size="md" showSubtitle subtitleText="Digital Evidence & Integrity Verification" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/verify"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1.5"
            >
              Public Verification
            </Link>
            <Link
              to="/login"
              className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 text-indigo-400 mb-6 shadow-xl">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="font-mono text-xs uppercase tracking-widest text-indigo-400 mb-2">
            Error 404 • Resource Not Located
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
            Page Not Found
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed mb-8">
            The page or record you are attempting to access does not exist, has been moved,
            or requires authenticated authorization to inspect.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Return to Home</span>
            </Link>

            <Link
              to="/verify"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            >
              <Search className="w-4 h-4 text-zinc-400" />
              <span>Verify Evidence Hash</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
