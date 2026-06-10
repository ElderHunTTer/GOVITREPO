import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TTB Label Reporting",
  description: "A Vercel-hosted showcase for label verification workflows."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
