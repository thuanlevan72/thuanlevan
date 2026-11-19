import { useId } from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 32, className = '' }: BrandLogoProps) {
  const uid = useId().replace(/:/g, '');
  const bgId = `tl-logo-bg-${uid}`;
  const glowId = `tl-logo-glow-${uid}`;
  const borderId = `tl-logo-border-${uid}`;
  const accentId = `tl-logo-accent-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        <linearGradient id={bgId} x1="48" y1="32" x2="464" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#05080F" />
          <stop offset="52%" stopColor="#0A192F" />
          <stop offset="100%" stopColor="#0F3057" />
        </linearGradient>
        <radialGradient
          id={glowId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(384 116) rotate(135) scale(290)"
        >
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.34" />
          <stop offset="55%" stopColor="#0284C7" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0A192F" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={borderId}
          x1="24"
          y1="24"
          x2="488"
          y2="488"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.65" />
          <stop offset="50%" stopColor="#1D4ED8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient
          id={accentId}
          x1="280"
          y1="150"
          x2="404"
          y2="368"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      <rect x="20" y="20" width="472" height="472" rx="116" fill={`url(#${bgId})`} />
      <rect x="20" y="20" width="472" height="472" rx="116" fill={`url(#${glowId})`} />
      <rect
        x="28"
        y="28"
        width="456"
        height="456"
        rx="108"
        stroke={`url(#${borderId})`}
        strokeWidth="12"
      />

      <path d="M114 148H288V192H223V364H179V192H114V148Z" fill="#F8FAFC" />
      <path d="M272 208H316V320H398V364H272V208Z" fill={`url(#${accentId})`} />
      <circle cx="376" cy="170" r="22" fill="#38BDF8" />
    </svg>
  );
}
