import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/react';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: 'Swar Pehchaan | Hindustani Classical Ear Training & Riyaz Tool',
  verification: {
    google: 'g980YmtfP-7dgmG8ef233J_07IUo-U3U0YqkKqKee0Y', // <-- Paste your exact code here
  },
  icons: {
    icon: '/swar_pehchaan_logo.jpeg',
    apple: '/swar_pehchaan_logo.jpeg',
  },
  description:
    'Free online Indian classical music ear training tool. Practice swar pehchaan, swar sangati, and pitch identification with an authentic Tanpura drone and Bhatkhande notation.',
  keywords: [
    'swar pehchaan',
    'swar pehchan online',
    'hindustani ear training',
    'indian classical ear training',
    'riyaz app',
    'tanpura online',
    'bhatkhande swar lipi test',
    'swar gyan practice',
    'harmonium swar test',
    'स्वर पहचान',
    'स्वर ज्ञान रियाज़',
  ],
  openGraph: {
    title: 'Swar Pehchaan — Ear Training for Hindustani Classical Music',
    description:
      'Train your ear to recognize Shuddha, Komal, and Teevra swaras across Mandra, Madhya, and Taar saptaks with an authentic Tanpura drone.',
    url: 'https://swar-pehchaan.vercel.app', // update with your custom domain if you have one
    siteName: 'Swar Pehchaan',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Swar Pehchaan — Hindustani Ear Training',
    description: 'Master your swar gyan and pitch identification with an authentic Tanpura drone.',
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
