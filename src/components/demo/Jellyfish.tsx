type JellyfishProps = {
  className?: string;
  variant?: "card" | "panel";
};

export default function Jellyfish({ className = "", variant = "card" }: JellyfishProps) {
  const isPanel = variant === "panel";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 280"
      preserveAspectRatio="xMidYMid meet"
      className={`pointer-events-none ${className}`}
    >
      <defs>
        <radialGradient id={`jelly-bell-${variant}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#A5F3FC" stopOpacity={isPanel ? 0.9 : 0.85} />
          <stop offset="35%" stopColor="#22D3EE" stopOpacity={isPanel ? 0.6 : 0.55} />
          <stop offset="70%" stopColor="#3B82F6" stopOpacity={isPanel ? 0.4 : 0.35} />
          <stop offset="100%" stopColor="#1E6FD9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`jelly-tentacle-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
        <filter id={`jelly-blur-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={isPanel ? "3" : "2.5"} />
        </filter>
      </defs>
      <g filter={`url(#jelly-blur-${variant})`}>
        <ellipse cx="170" cy="110" rx="95" ry="68" fill={`url(#jelly-bell-${variant})`} />
        <ellipse cx="95" cy="130" rx="55" ry="42" fill={`url(#jelly-bell-${variant})`} opacity="0.55" />
        {isPanel && (
          <ellipse cx="240" cy="160" rx="40" ry="32" fill={`url(#jelly-bell-${variant})`} opacity="0.45" />
        )}
      </g>
      <g
        stroke={`url(#jelly-tentacle-${variant})`}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      >
        <path d="M 110 145 Q 105 190 115 240" />
        <path d="M 140 155 Q 145 200 135 250" />
        <path d="M 170 160 Q 165 210 175 260" />
        <path d="M 200 155 Q 205 200 195 248" />
        <path d="M 230 145 Q 235 188 220 235" />
      </g>
    </svg>
  );
}
