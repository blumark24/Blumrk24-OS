import Image from "next/image";

interface OfficialBlumarkLogoProps {
  maxHeight?: number;
  className?: string;
}

export default function OfficialBlumarkLogo({ maxHeight = 40, className = "" }: OfficialBlumarkLogoProps) {
  return (
    <Image
      src="/brand/blumark24-logo-official.png"
      width={240}
      height={96}
      alt="Blumark24 Marketing Agency"
      className={`h-auto w-auto object-contain ${className}`}
      style={{ maxHeight: `${maxHeight}px`, maxWidth: `${maxHeight * 2.5}px` }}
      priority
      unoptimized
    />
  );
}
