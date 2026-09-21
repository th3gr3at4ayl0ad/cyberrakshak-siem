import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CyberRakshak SIEM & Parental Control",
  description: "Enterprise SIEM and parental control platform with real-time threat detection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
