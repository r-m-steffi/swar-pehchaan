// components/Logo.tsx
export default function Logo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-neutral-900 border border-amber-500/40 p-2 shadow-inner ${className}`}>
      {/* Tanpura strings & Devanagari Sa glyph */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
      >
        {/* Stylized resonance soundwaves */}
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.35" />
        <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
        
        {/* Stylized Sa (सा) letterform */}
        <text
          x="50%"
          y="56%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="currentColor"
          fontSize="22"
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          सा
        </text>
      </svg>
    </div>
  );
}