/** Friendly smiling molar — the clinic's own logo character, drawn as SVG.
 *  No photos anywhere on this site; illustrations only. */
export default function Molar({
  className = "",
  tooth = "#ffffff",
  outline = "#0e7c7b",
  cheek = "#d92b2b",
}: {
  className?: string;
  tooth?: string;
  outline?: string;
  cheek?: string;
}) {
  return (
    <svg viewBox="0 0 220 210" className={className} role="img" aria-label="Smiling tooth">
      {/* molar body */}
      <path
        d="M110 18 C 62 18 34 44 34 88 C 34 118 44 138 52 158 C 58 174 62 190 76 190 C 90 190 92 172 96 156 C 99 144 102 138 110 138 C 118 138 121 144 124 156 C 128 172 130 190 144 190 C 158 190 162 174 168 158 C 176 138 186 118 186 88 C 186 44 158 18 110 18 Z"
        fill={tooth}
        stroke={outline}
        strokeWidth="7"
        strokeLinejoin="round"
      />
      {/* red swoosh, echoing the logo's "A" ribbon */}
      <path
        d="M44 92 C 80 76 140 76 178 96 C 150 82 72 84 44 92 Z"
        fill="#d92b2b"
        opacity="0.9"
      />
      {/* eyes */}
      <circle cx="84" cy="86" r="7.5" fill="#0b2e35" />
      <circle cx="136" cy="86" r="7.5" fill="#0b2e35" />
      <circle cx="86.5" cy="83.5" r="2.4" fill="#ffffff" />
      <circle cx="138.5" cy="83.5" r="2.4" fill="#ffffff" />
      {/* smile */}
      <path
        d="M88 112 C 98 124 122 124 132 112"
        fill="none"
        stroke="#0b2e35"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* cheeks */}
      <circle cx="66" cy="108" r="8" fill={cheek} opacity="0.28" />
      <circle cx="154" cy="108" r="8" fill={cheek} opacity="0.28" />
      {/* sparkle */}
      <path d="M164 34 l3.2 8.4 8.4 3.2 -8.4 3.2 -3.2 8.4 -3.2 -8.4 -8.4 -3.2 8.4 -3.2 z" fill="#1e9e6a" />
      <path d="M52 26 l2.4 6.2 6.2 2.4 -6.2 2.4 -2.4 6.2 -2.4 -6.2 -6.2 -2.4 6.2 -2.4 z" fill="#0e7c7b" />
    </svg>
  );
}

/** Small tooth used as a decorative pattern / bullet. */
export function ToothMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.5 C 7.5 2.5 5 5.5 5 9.5 C 5 12.5 6 14.5 6.8 16.5 C 7.4 18 7.8 20.5 9.3 20.5 C 10.8 20.5 10.9 18.5 11.2 17 C 11.4 15.9 11.6 15.4 12 15.4 C 12.4 15.4 12.6 15.9 12.8 17 C 13.1 18.5 13.2 20.5 14.7 20.5 C 16.2 20.5 16.6 18 17.2 16.5 C 18 14.5 19 12.5 19 9.5 C 19 5.5 16.5 2.5 12 2.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}
