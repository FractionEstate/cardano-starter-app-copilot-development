import type { Metadata } from 'next';
import React from "react";
import { Footer } from "../components/footer/Footer";
import { Header } from "../components/header/Header";
import './globals.css';
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: 'Cardano Starter',
  description: 'Next.js Cardano starter (no WASM on frontend)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
