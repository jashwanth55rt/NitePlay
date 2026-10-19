'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

interface AgeVerificationModalProps {
  onVerified: () => void;
}

export default function AgeVerificationModal({ onVerified }: AgeVerificationModalProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('niteplay_age_verified');
      const session = sessionStorage.getItem('niteplay_age_verified');
      return !stored && !session;
    }
    return false;
  });
  const [rememberMe, setRememberMe] = useState(true);

  const handleConfirm = () => {
    if (rememberMe) {
      localStorage.setItem('niteplay_age_verified', 'true');
    } else {
      sessionStorage.setItem('niteplay_age_verified', 'true');
    }
    setIsOpen(false);
    onVerified();
  };

  const handleExit = () => {
    // Redirect to safe non-adult site
    window.location.href = 'https://www.google.com';
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in"
    >
      <div className="relative w-full max-w-md bg-[#17171D] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100 flex flex-col items-center text-center">
        {/* Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-[#E50914]/15 border border-[#E50914]/30 flex items-center justify-center mb-5 text-[#E50914]">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title */}
        <h2 id="age-gate-title" className="text-2xl font-bold tracking-tight text-white mb-2">
          Age Verification Required
        </h2>

        {/* Notice text */}
        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          This website contains adult-oriented material restricted to adults aged 18 and older (or the legal age of majority in your jurisdiction). By proceeding, you certify that you meet the legal age requirements.
        </p>

        {/* Checklist */}
        <div className="w-full bg-[#0B0B0F]/80 rounded-xl p-4 border border-white/5 text-left text-xs text-slate-400 space-y-2 mb-6">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
            <span>I am at least 18 years old (or legal majority).</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
            <span>Adult content is legal in my geographic location.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-[#E50914] shrink-0 mt-0.5" />
            <span>I agree not to permit minors access to this service.</span>
          </div>
        </div>

        {/* Remember me toggle */}
        <label className="flex items-center gap-3 w-full text-xs text-slate-400 mb-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded bg-[#0B0B0F] border-white/20 text-[#E50914] focus:ring-[#E50914] focus:ring-offset-[#17171D]"
          />
          <span>Remember my verification on this device</span>
        </label>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={handleConfirm}
            className="flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#c20711] text-white font-semibold text-sm transition-colors shadow-lg shadow-[#E50914]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            I am 18 or Older — Enter
          </button>
          <button
            onClick={handleExit}
            className="min-h-[48px] px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-sm transition-colors border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Exit (Leave Site)
          </button>
        </div>

        <div className="mt-5 text-[11px] text-slate-400">
          Compliant with adult content regulations and provider policies.
        </div>
      </div>
    </div>
  );
}
