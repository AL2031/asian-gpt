export function SealMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="36" height="36" rx="6" fill="#AE3B34" />
      <rect
        x="5.5"
        y="5.5"
        width="29"
        height="29"
        rx="3.5"
        fill="none"
        stroke="#F6F2E8"
        strokeWidth="1.4"
        opacity="0.85"
      />
      <path
        d="M11 24c3-5 6-10.5 6-13.5"
        stroke="#F6F2E8"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M9.5 15.5c4.5 1.5 9 1.5 13 0"
        stroke="#F6F2E8"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M23 28c2.5-6 5-12 5.6-17"
        stroke="#F6F2E8"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="30.5" cy="10.5" r="1.7" fill="#F6F2E8" />
    </svg>
  );
}
