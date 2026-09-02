import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { WebMcpRelay } from "@/components/WebMcpRelay";

import "./globals.css";

export const metadata: Metadata = {
  title: "ArcadeOps Relay — Project Aurora",
  description: "WebMCP mission control from browser intent to verified delivery.",
  applicationName: "ArcadeOps Relay",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${GeistSans.variable} ${GeistMono.variable}`} lang="en">
      <body>
        <WebMcpRelay />
        {children}
      </body>
    </html>
  );
}
