'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, useSyncExternalStore } from 'react';
import Image from 'next/image';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  MessageSquare,
  Eye,
  X,
  CheckCircle2,
} from 'lucide-react';
import { ReviewsSectionContent, ReviewItem } from '@/types/site-content';
import { DEFAULT_REVIEWS_SECTION_CONTENT, DEFAULT_GOOGLE_MAPS_URL } from '@/lib/firebase/content-defaults';

interface GoogleReviewsSectionProps {
  content?: ReviewsSectionContent;
  id?: string;
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function subscribeWindowWidth(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function getWindowWidthSnapshot() {
  if (typeof window === 'undefined') return 1200;
  return window.innerWidth;
}

export function GoogleReviewsSection({
  content = DEFAULT_REVIEWS_SECTION_CONTENT,
  id = 'reviews',
}: GoogleReviewsSectionProps) {
  const sectionContent = content || DEFAULT_REVIEWS_SECTION_CONTENT;

  // Filter only active, visible reviews and sort by sortOrder
  const allReviews = useMemo(() => {
    const list = Array.isArray(sectionContent.reviews)
      ? sectionContent.reviews
      : DEFAULT_REVIEWS_SECTION_CONTENT.reviews;
    return list
      .filter((r) => r.isVisible !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [sectionContent.reviews]);

  const totalReviews = allReviews.length;

  // Standard React state management for active review index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Clamped active index matching totalReviews
  const activeIndex = totalReviews > 0 ? ((currentIndex % totalReviews) + totalReviews) % totalReviews : 0;

  const [isPaused, setIsPaused] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [activeScreenshotModal, setActiveScreenshotModal] = useState<ReviewItem | null>(null);

  // Responsive device width tracking via useSyncExternalStore
  const windowWidth = useSyncExternalStore(subscribeWindowWidth, getWindowWidthSnapshot, () => 1200);

  // Track reduced motion preference via useSyncExternalStore
  const prefersReducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);

  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Navigate functions with circular wrap
  const nextSlide = useCallback(() => {
    if (totalReviews <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalReviews);
  }, [totalReviews]);

  const prevSlide = useCallback(() => {
    if (totalReviews <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalReviews) % totalReviews);
  }, [totalReviews]);

  // Autoplay timer: exactly 1,000ms (1 second) interval by default
  useEffect(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }

    if (isPaused || prefersReducedMotion || totalReviews <= 1) {
      return;
    }

    // Default to 1,000 milliseconds (one second) or configured autoAdvanceSeconds
    const intervalMs = Math.max(1000, Math.round((sectionContent.autoAdvanceSeconds ?? 1) * 1000));

    autoPlayTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalReviews);
    }, intervalMs);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, [isPaused, prefersReducedMotion, totalReviews, sectionContent.autoAdvanceSeconds]);

  // Touch swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
    }
  };

  const handleTouchEnd = () => {
    const delta = touchDeltaXRef.current;
    const threshold = 40;
    if (delta > threshold) {
      prevSlide();
    } else if (delta < -threshold) {
      nextSlide();
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
    setTimeout(() => setIsPaused(false), 800);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  };

  const toggleExpand = (reviewId: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  // Circular offset calculation: returns distance from activeIndex (-total/2 to +total/2)
  const getCircularDiff = (idx: number, current: number, total: number) => {
    if (total <= 0) return 0;
    let diff = (idx - current) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  // Responsive layout values
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  const slideOffset = isMobile ? Math.min(320, windowWidth * 0.92) : isTablet ? 290 : 380;
  const sideScale = isMobile ? 0.84 : isTablet ? 0.86 : 0.88;
  const sideOpacity = isMobile ? 0.25 : isTablet ? 0.55 : 0.65;

  // Compute 3D coverflow styling per card
  const getCardStyle = (diff: number): React.CSSProperties => {
    if (prefersReducedMotion) {
      if (diff === 0) {
        return {
          transform: 'translate(-50%, -50%)',
          opacity: 1,
          zIndex: 20,
          pointerEvents: 'auto',
        };
      }
      return {
        display: 'none',
      };
    }

    // Active Center Card: scale(1.0), full opacity, elevated shadow
    if (diff === 0) {
      return {
        transform: 'translate(-50%, -50%) scale(1.0)',
        opacity: 1,
        zIndex: 20,
        pointerEvents: 'auto',
        boxShadow: '0 20px 25px -5px rgba(15, 44, 89, 0.12), 0 8px 10px -6px rgba(15, 44, 89, 0.08)',
      };
    }

    // Immediate Right Card: scale(0.86–0.88), shifted right
    if (diff === 1) {
      return {
        transform: `translate(calc(-50% + ${slideOffset}px), -50%) scale(${sideScale})`,
        opacity: sideOpacity,
        zIndex: 10,
        pointerEvents: 'auto',
        boxShadow: '0 4px 6px -1px rgba(15, 44, 89, 0.05)',
      };
    }

    // Immediate Left Card: scale(0.86–0.88), shifted left
    if (diff === -1) {
      return {
        transform: `translate(calc(-50% - ${slideOffset}px), -50%) scale(${sideScale})`,
        opacity: sideOpacity,
        zIndex: 10,
        pointerEvents: 'auto',
        boxShadow: '0 4px 6px -1px rgba(15, 44, 89, 0.05)',
      };
    }

    // Distant / Hidden Cards (|diff| >= 2)
    const dir = diff > 0 ? 1 : -1;
    return {
      transform: `translate(calc(-50% + ${dir * (slideOffset + 260)}px), -50%) scale(0.72)`,
      opacity: 0,
      zIndex: 1,
      pointerEvents: 'none',
    };
  };

  const mapsUrl = sectionContent.googleMapsUrl || DEFAULT_GOOGLE_MAPS_URL;

  // Authoritative statistics derived dynamically from eligible enabled reviews
  const totalReviewsCount = totalReviews;
  const averageRating = useMemo(() => {
    if (allReviews.length === 0) return 5.0;
    const validRatings = allReviews
      .map((r) => Number(r.rating))
      .filter((r) => !isNaN(r) && r >= 1 && r <= 5);
    if (validRatings.length === 0) return 5.0;
    const sum = validRatings.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / validRatings.length).toFixed(1));
  }, [allReviews]);

  const ratingAvg = averageRating;
  const countTotal = totalReviewsCount;

  // Don't render section if disabled or no reviews exist
  if (sectionContent.enabled === false || totalReviews === 0) {
    return null;
  }

  return (
    <section
      id={id}
      aria-label="Google Reviews and Client Testimonials"
      className="relative w-full py-16 md:py-20 bg-slate-50 border-y border-slate-200/70 overflow-hidden"
    >
      {/* Decorative subtle background accents */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(19, 131, 84, 0.04) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(15, 44, 89, 0.05) 0%, transparent 40%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          {/* Google Verified Badge with Authoritative Live Statistics */}
          {sectionContent.showGoogleRatingBadge !== false && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs mb-4">
              {/* Google G icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-xs font-semibold text-slate-800 tracking-wide">
                Google Reviews
              </span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900">{ratingAvg.toFixed(1)}</span>
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                  ))}
                </div>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">({countTotal} Verified)</span>
            </div>
          )}

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2c59] tracking-tight">
            {sectionContent.heading || 'What Our Clients Say'}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {sectionContent.subtitle ||
              '“Trusted by our clients for reliable accounting, professional guidance, and hassle-free tax filing.”'}
          </p>
        </div>

        {/* Center-Focused Carousel Viewport */}
        <div
          className="relative w-full overflow-hidden py-4 outline-none select-none"
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Google Reviews Carousel"
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Previous Arrow Button */}
          {totalReviews > 1 && (
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous review"
              className="absolute left-1 sm:left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 border border-slate-200 text-slate-700 shadow-md hover:bg-white hover:text-[#0f2c59] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#138354] focus:ring-offset-2 transition-all flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          {/* Next Arrow Button */}
          {totalReviews > 1 && (
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next review"
              className="absolute right-1 sm:right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/95 border border-slate-200 text-slate-700 shadow-md hover:bg-white hover:text-[#0f2c59] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#138354] focus:ring-offset-2 transition-all flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          {/* Cards Track: Absolute center-aligned cards */}
          <div className="relative w-full h-[410px] sm:h-[430px]">
            {allReviews.map((review, idx) => {
              const diff = getCircularDiff(idx, activeIndex, totalReviews);
              const isCenter = diff === 0;
              const isExpanded = Boolean(expandedReviews[review.id]);
              const isLong = review.reviewText.length > 130;
              const cardStyle = getCardStyle(diff);

              return (
                <div
                  key={review.id}
                  style={cardStyle}
                  onClick={() => {
                    if (diff === 1) nextSlide();
                    else if (diff === -1) prevSlide();
                  }}
                  className={`absolute left-1/2 top-1/2 w-[88vw] sm:w-[390px] md:w-[420px] max-w-[430px] h-[380px] sm:h-[400px] rounded-2xl bg-white border border-slate-200/90 p-6 flex flex-col justify-between transition-all duration-600 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                    isCenter ? 'ring-1 ring-[#138354]/30' : 'cursor-pointer hover:opacity-80'
                  }`}
                >
                  <div>
                    {/* Reviewer Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {review.reviewerImageUrl ? (
                          <Image
                            src={review.reviewerImageUrl}
                            alt={review.reviewerName}
                            width={44}
                            height={44}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-xs select-none"
                            style={{
                              backgroundColor: review.avatarBgColor || '#0f2c59',
                            }}
                          >
                            {review.reviewerInitials ||
                              review.reviewerName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        {/* Name & Review count */}
                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-tight">
                            {review.reviewerName}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {review.reviewCountText || '1 review'}
                          </p>
                        </div>
                      </div>

                      {/* Google style 3-dots indicator placeholder matching screenshot */}
                      <div className="text-slate-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="12" cy="19" r="1.8" />
                        </svg>
                      </div>
                    </div>

                    {/* Rating, Date, and NEW badge */}
                    <div className="flex items-center flex-wrap gap-2 mb-3">
                      <div className="flex items-center text-amber-400">
                        {[...Array(review.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                        ))}
                      </div>

                      <span className="text-xs text-slate-500 font-medium">
                        {review.reviewDate}
                      </span>

                      {review.isNew && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-300 rounded uppercase tracking-wider">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Review text */}
                    <div className="text-slate-700 text-sm sm:text-base leading-relaxed">
                      <p className={!isExpanded && isLong ? 'line-clamp-3' : ''}>
                        {review.reviewText}
                      </p>
                      {isLong && isCenter && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(review.id);
                          }}
                          className="mt-1.5 text-xs font-semibold text-[#138354] hover:text-[#0f2c59] hover:underline focus:outline-none cursor-pointer"
                        >
                          {isExpanded ? 'Read less' : 'Read more'}
                        </button>
                      )}
                    </div>

                    {/* Owner Response (e.g. Kevin Gibson's review) */}
                    {review.ownerResponse && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 pl-3 border-l-2 border-l-[#138354]/60 bg-slate-50/70 p-2.5 rounded-r-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-3.5 h-3.5 text-[#138354]" />
                          <span className="text-xs font-bold text-slate-800">
                            Response from the owner
                          </span>
                          {review.ownerResponseDate && (
                            <span className="text-[11px] text-slate-500">
                              {review.ownerResponseDate}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 italic">
                          &ldquo;{review.ownerResponse}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Screenshot proof trigger */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {review.reviewScreenshotUrl ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveScreenshotModal(review);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#0f2c59] font-medium transition-colors cursor-pointer"
                        title="View original Google review screenshot"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>View Review Proof</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <CheckCircle2 className="w-3 h-3 text-[#138354]" />
                        <span>Verified Client</span>
                      </div>
                    )}

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#138354] transition-colors"
                      title="Open Finance with Geetha Google Reviews in a new tab"
                    >
                      <span>Google Review</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Pagination Indicators: One distinct dot per review */}
          {totalReviews > 1 && (
            <div
              role="tablist"
              aria-label="Client review pagination"
              className="flex justify-center items-center gap-2 mt-6 flex-wrap px-4"
            >
              {allReviews.map((review, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={review.id || `review-dot-${idx}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Go to review ${idx + 1} of ${totalReviews} by ${review.reviewerName}`}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-400 ease-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#138354] focus:ring-offset-2 ${
                      isActive
                        ? 'w-8 bg-[#138354] shadow-xs'
                        : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Call to Action: View All Google Reviews & Get Directions */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-[#0f2c59] text-white font-semibold text-sm shadow-md hover:bg-[#138354] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#138354] focus:ring-offset-2 transition-all duration-200"
          >
            <span>View All Google Reviews</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-sm shadow-xs hover:border-[#138354] hover:text-[#138354] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#138354] focus:ring-offset-2 transition-all duration-200"
          >
            <MapPin className="w-4 h-4 text-[#138354]" />
            <span>Get Directions on Google Maps</span>
          </a>
        </div>
      </div>

      {/* Review Screenshot Modal Dialog */}
      {activeScreenshotModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Original Google Review screenshot for ${activeScreenshotModal.reviewerName}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveScreenshotModal(null)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#138354]" />
                <h4 className="text-base font-bold text-slate-900">
                  Google Review Proof: {activeScreenshotModal.reviewerName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveScreenshotModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close review proof modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Preview with proper aspect ratio */}
            <div className="mt-4 flex items-center justify-center bg-slate-50 rounded-xl p-3 border border-slate-200/60 overflow-hidden">
              {activeScreenshotModal.reviewScreenshotUrl && (
                <Image
                  src={activeScreenshotModal.reviewScreenshotUrl}
                  alt={`Google review screenshot from ${activeScreenshotModal.reviewerName}`}
                  width={640}
                  height={360}
                  className="max-h-[60vh] w-auto h-auto object-contain rounded-lg"
                  priority
                />
              )}
            </div>

            {/* Footer with external link */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Verified Google Business Review
              </span>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#138354] hover:underline"
              >
                <span>View on Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
