'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

export function GoogleReviewsSection({
  content = DEFAULT_REVIEWS_SECTION_CONTENT,
  id = 'reviews',
}: GoogleReviewsSectionProps) {
  const sectionContent = content || DEFAULT_REVIEWS_SECTION_CONTENT;

  // Filter only active, visible reviews and sort by sortOrder
  const allReviews = useMemo(() => {
    const list = sectionContent.reviews && sectionContent.reviews.length > 0
      ? sectionContent.reviews
      : DEFAULT_REVIEWS_SECTION_CONTENT.reviews;
    return list
      .filter((r) => r.isVisible !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [sectionContent.reviews]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [activeScreenshotModal, setActiveScreenshotModal] = useState<ReviewItem | null>(null);
  const [visibleSlides, setVisibleSlides] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth < 640
        ? 1
        : window.innerWidth < 1024
        ? 2
        : 3
      : 3
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);
  const carouselContainerRef = useRef<HTMLDivElement | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive breakpoints for slide count
  useEffect(() => {
    const updateSlideCount = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleSlides(1);
      } else if (width < 1024) {
        setVisibleSlides(2);
      } else {
        setVisibleSlides(3);
      }
    };

    window.addEventListener('resize', updateSlideCount);
    return () => window.removeEventListener('resize', updateSlideCount);
  }, []);

  // Check user reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const totalReviews = allReviews.length;
  // Maximum starting index so no empty space appears at the end
  const maxIndex = Math.max(0, totalReviews - visibleSlides);

  // Advance carousel safely
  const nextSlide = useCallback(() => {
    if (maxIndex <= 0) return;
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    if (maxIndex <= 0) return;
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Automatic advance timer
  useEffect(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }

    if (isPaused || prefersReducedMotion || maxIndex <= 0) {
      return;
    }

    const intervalSeconds = sectionContent.autoAdvanceSeconds || 4.5;
    autoPlayTimerRef.current = setInterval(() => {
      nextSlide();
    }, intervalSeconds * 1000);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [isPaused, prefersReducedMotion, maxIndex, sectionContent.autoAdvanceSeconds, nextSlide]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
    }
  };

  const handleTouchEnd = () => {
    const delta = touchDeltaXRef.current;
    const threshold = 40; // 40px swipe threshold
    if (delta > threshold) {
      prevSlide();
    } else if (delta < -threshold) {
      nextSlide();
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  const toggleExpand = (reviewId: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const mapsUrl = sectionContent.googleMapsUrl || DEFAULT_GOOGLE_MAPS_URL;
  const ratingAvg = sectionContent.averageRating || 5.0;
  const countTotal = sectionContent.totalReviewsCount || totalReviews;

  // Don't render section if disabled or no reviews exist
  if (sectionContent.enabled === false) {
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
          {/* Google Verified Badge */}
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

        {/* Carousel Container */}
        <div
          ref={carouselContainerRef}
          className="relative px-1 sm:px-4"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Left Arrow Button */}
          {maxIndex > 0 && (
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous client reviews"
              className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 border border-slate-200 text-slate-700 shadow-md hover:bg-white hover:text-[#0f2c59] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#138354] focus:ring-offset-2 transition-all flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          {/* Right Arrow Button */}
          {maxIndex > 0 && (
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next client reviews"
              className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 border border-slate-200 text-slate-700 shadow-md hover:bg-white hover:text-[#0f2c59] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#138354] focus:ring-offset-2 transition-all flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          {/* Overflow Track Wrapper */}
          <div className="overflow-hidden py-3">
            <div
              className={`flex ${
                prefersReducedMotion ? 'transition-none' : 'transition-transform duration-500 ease-out'
              }`}
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleSlides)}%)`,
              }}
            >
              {allReviews.map((review) => {
                const isExpanded = Boolean(expandedReviews[review.id]);
                const isLong = review.reviewText.length > 130;

                return (
                  <div
                    key={review.id}
                    className="flex-shrink-0 px-2.5 sm:px-3 box-border"
                    style={{ width: `${100 / visibleSlides}%` }}
                  >
                    <div className="h-full flex flex-col justify-between bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow duration-200">
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
                          {isLong && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(review.id)}
                              className="mt-1.5 text-xs font-semibold text-[#138354] hover:text-[#0f2c59] hover:underline focus:outline-none cursor-pointer"
                            >
                              {isExpanded ? 'Read less' : 'Read more'}
                            </button>
                          )}
                        </div>

                        {/* Owner Response (e.g. Kevin Gibson's review) */}
                        {review.ownerResponse && (
                          <div className="mt-4 pt-3 border-t border-slate-100 pl-3 border-l-2 border-l-[#138354]/60 bg-slate-50/70 p-2.5 rounded-r-lg">
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
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                        {review.reviewScreenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => setActiveScreenshotModal(review)}
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
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#138354] transition-colors"
                          title="Open Finance with Geetha Google Reviews in a new tab"
                        >
                          <span>Google Review</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination Dots */}
          {maxIndex > 0 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              {[...Array(maxIndex + 1)].map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    currentIndex === idx
                      ? 'w-8 bg-[#138354]'
                      : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Call to Action: View All Google Reviews & Get Directions */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-[#0f2c59] text-white font-semibold text-sm shadow-md hover:bg-[#138354] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#138354] focus:ring-offset-2 transition-all duration-200"
          >
            {/* Google G icon */}
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>View All Google Reviews</span>
            <ExternalLink className="w-4 h-4 ml-0.5 opacity-80" />
          </a>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-medium text-sm shadow-2xs hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all duration-200"
          >
            <MapPin className="w-4 h-4 text-[#138354]" />
            <span>Get Directions on Google Maps</span>
          </a>
        </div>
      </div>

      {/* Modal: Original Google Review Screenshot Proof */}
      {activeScreenshotModal && activeScreenshotModal.reviewScreenshotUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Original Google Review screenshot for ${activeScreenshotModal.reviewerName}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveScreenshotModal(null)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#138354]" />
                <h3 className="font-bold text-slate-900 text-base">
                  Google Review Proof: {activeScreenshotModal.reviewerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveScreenshotModal(null)}
                aria-label="Close screenshot modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
              <Image
                src={activeScreenshotModal.reviewScreenshotUrl}
                alt={`Google review screenshot from ${activeScreenshotModal.reviewerName}`}
                width={800}
                height={400}
                className="w-full h-auto object-contain max-h-[60vh] rounded-lg"
                priority
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Verified client review recorded from Google Maps</span>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-[#138354] hover:underline"
              >
                <span>Open listing</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
