"use client";

interface BrandLogoProps {
  logoUrl?: string;
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function BrandLogo({ logoUrl, text, size = "md", className = "" }: BrandLogoProps) {
  const envLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL || logoUrl;
  const envText = process.env.NEXT_PUBLIC_APP_LOGO_TEXT || text || "iR";

  const sizeClasses = {
    sm: "w-8 h-8 text-sm rounded-lg",
    md: "w-10 h-10 text-lg rounded-xl",
    lg: "w-14 h-14 text-2xl rounded-2xl",
  };

  if (envLogoUrl) {
    return (
      <img
        src={envLogoUrl}
        alt="Brand Logo"
        className={`object-contain ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div
      style={{ backgroundColor: "rgb(0, 103, 71)" }}
      className={`${sizeClasses[size]} flex items-center justify-center font-extrabold text-white shadow-lg shadow-emerald-900/10 ${className}`}
    >
      {envText}
    </div>
  );
}
