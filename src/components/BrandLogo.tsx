interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 40, className = "" }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Invelix logo"
    >
      <rect width="40" height="40" rx="10" fill="url(#invelix-grad)" />
      <path
        d="M18 11h4v14h-4z"
        fill="white"
      />
      <path
        d="M14 27.5l3.2 3.2 8.8-8.8"
        stroke="hsl(142 76% 60%)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <defs>
        <linearGradient id="invelix-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(239 84% 58%)" />
          <stop offset="1" stopColor="hsl(258 85% 62%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
