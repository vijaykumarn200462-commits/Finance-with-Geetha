'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowUpRight, Globe } from 'lucide-react';
import { useSocialSettings, useContactSettings, useDynamicPricing, useProfilePhoto, DEFAULT_PROFILE_IMAGE } from '@/lib/firebase/content';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { CurrencySelector } from './CurrencySelector';
import { ConnectionInfoModal } from './ConnectionInfoModal';

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.76v8.37H6.46V10.9M7.84 6.2a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/>
    </svg>
  );
}

interface FooterProps {
  profileImageUrl?: string;
}

export function Footer({ profileImageUrl }: FooterProps = {}) {
  const { youtubeUrl, linkedinUrl } = useSocialSettings();
  const { supportEmail } = useContactSettings();
  const pricing = useDynamicPricing();
  const { formatPrice, isIpDisplayEnabled } = useCurrency();
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const liveProfileImage = useProfilePhoto(profileImageUrl);

  const activeEmail = supportEmail || 'cageethanofficial@gmail.com';

  return (
    <footer className="bg-[#181918] text-[#FAF7F2] border-t border-[#2B2D2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 pb-12 border-b border-[#2C2E2B]">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-500/50 shadow-inner flex-shrink-0">
                <img
                  src={liveProfileImage}
                  alt="Geetha N."
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== DEFAULT_PROFILE_IMAGE && !target.src.endsWith(DEFAULT_PROFILE_IMAGE)) {
                      target.src = DEFAULT_PROFILE_IMAGE;
                    }
                  }}
                />
              </div>
              <div>
                <span className="font-serif text-xl font-bold tracking-tight text-white block">
                  Finance with Geetha
                </span>
                <span className="text-xs text-emerald-400 font-semibold tracking-wide uppercase">
                  Bookkeeping & Accounting
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Professional, meticulous bookkeeping and financial reporting services for businesses. Meticulous records, transparent pricing, and peace of mind.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p>Independent Bookkeeper & Accountant — Geetha N.</p>
              <p>Bengaluru, Karnataka, India · Mon - Sat: 9:00 AM - 6:00 PM</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-[#84A98C] font-semibold">
              Explore
            </p>
            <ul className="space-y-2.5 text-sm text-[#D5D5CF]">
              <li>
                <Link href="/#what-i-teach" className="hover:text-white transition-colors">
                  What I Teach
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-white transition-colors">
                  The Community ({formatPrice(pricing.community, 'mo')})
                </Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-white transition-colors">
                  The Book ({formatPrice(pricing.book)})
                </Link>
              </li>
              <li>
                <Link href="/store" className="hover:text-white transition-colors">
                  Templates & Cheat Sheets
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Geetha
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect & Support */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-[#84A98C] font-semibold">
              Connect
            </p>
            <ul className="space-y-2.5 text-sm text-[#D5D5CF]">
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Geetha
                </Link>
              </li>
              {youtubeUrl && (
                <li>
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <YoutubeIcon className="w-4 h-4 text-[#C9A96E]" />
                    <span>YouTube</span>
                    <ArrowUpRight className="w-3 h-3 text-[#7A7A74]" />
                  </a>
                </li>
              )}
              {linkedinUrl && (
                <li>
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <LinkedinIcon className="w-4 h-4 text-[#C9A96E]" />
                    <span>LinkedIn</span>
                    <ArrowUpRight className="w-3 h-3 text-[#7A7A74]" />
                  </a>
                </li>
              )}
              <li>
                <a
                  href={`mailto:${activeEmail}`}
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#C9A96E]" />
                  <span>Email Geetha</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Region, Currency & Legal */}
          <div className="space-y-4">
            <p className="text-xs font-mono uppercase tracking-widest text-[#84A98C] font-semibold">
              Region & Currency
            </p>

            <div className="space-y-2">
              <CurrencySelector variant="footer" />

              {isIpDisplayEnabled && (
                <button
                  type="button"
                  onClick={() => setIsConnectionModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#A8A8A2] hover:text-white font-mono transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-[#84A98C]" />
                  <span>Connection Details</span>
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-[#2C2E2A]">
              <p className="text-xs font-mono uppercase tracking-widest text-[#84A98C] font-semibold mb-2">
                Legal
              </p>
              <ul className="space-y-2 text-sm text-[#D5D5CF]">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 Finance with Geetha. All rights reserved. Professional Bookkeeping & Accounting by Geetha N.</p>
          <div className="flex items-center gap-4 text-xs">
            <a href="tel:9538913912" className="text-emerald-400 hover:text-white transition-colors">
              📞 9538913912
            </a>
            <span>·</span>
            <a href="mailto:Cageethanofficail@gmail.com" className="text-slate-400 hover:text-white transition-colors">
              Cageethanofficail@gmail.com
            </a>
          </div>
        </div>
      </div>

      <ConnectionInfoModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
      />
    </footer>
  );
}
