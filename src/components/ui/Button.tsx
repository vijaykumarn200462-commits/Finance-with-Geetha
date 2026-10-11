'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'dark' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none disabled:active:scale-100 select-none';

  const variants = {
    primary:
      'bg-[#244634] text-[#FAF7F2] hover:bg-[#1B3527] focus-visible:ring-[#244634] shadow-xs',
    secondary:
      'bg-[#F3EFE8] text-[#181918] hover:bg-[#EAE4D9] border border-[#E2DBD0] focus-visible:ring-[#5C5E5B]',
    outline:
      'bg-transparent text-[#181918] hover:bg-[#F3EFE8] border border-[#D5CDC0] focus-visible:ring-[#244634]',
    dark:
      'bg-[#181918] text-[#FAF7F2] hover:bg-[#2B2D2A] focus-visible:ring-[#181918] shadow-xs',
    ghost:
      'bg-transparent text-[#181918] hover:bg-[#F3EFE8] focus-visible:ring-[#244634]',
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 rounded-md gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-lg gap-2',
    lg: 'text-base px-6 py-3.5 rounded-lg gap-2.5 font-semibold',
  };

  const combinedStyles = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedStyles}>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </Link>
    );
  }

  return (
    <button
      className={combinedStyles}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
      {!isLoading && leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
}
