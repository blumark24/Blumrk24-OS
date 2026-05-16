import Image from "next/image";

interface OfficialBlumarkLogoProps {
  maxHeight?: number;
  className?: string;
}

/**
 * Official Blumark24 brand logo from public/brand/blumark24-logo-official.png.
 * Rendered inside a white/translucent pill so it reads on dark backgrounds.
 */
export default function OfficialBlumarkLogo({ maxHeight = 40, className = "" }: OfficialBlumarkLogoProps) {
  return (
    <span
      className={`inline-flex items-center rounded-xl bg-white/95 shadow-sm flex-shrink-0 ${className}`}
      style={{ padding: "4px 10px" }}
    >
      <Image
        src="/brand/blumark24-logo-official.png"
        width={240}
        height={96}
        alt="Blumark24 Marketing Agency"
        className="h-auto w-auto object-contain"
        style={{ maxHeight: `${maxHeight}px`, maxWidth: `${maxHeight * 2.5}px` }}
        priority
        unoptimized
      />
    </span>
  );
}
