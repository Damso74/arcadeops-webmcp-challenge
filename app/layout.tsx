import type { Metadata } from "next";

import { WebMcpRelay } from "@/components/WebMcpRelay";

import "./globals.css";

export const metadata: Metadata = {
  title: "ArcadeOps Relay — Project Aurora",
  description: "Browser agents delegate real work to AI workers. Humans decide. Evidence proves.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WebMcpRelay />
        {children}
      </body>
    </html>
  );
}
