import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "iRekon - Transaction Reconciliation System",
  description: "Enterprise High-Performance Transaction Reconciliation App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
