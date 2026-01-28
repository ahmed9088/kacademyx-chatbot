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

export const metadata = {
  title: "Kacademyx | Advanced Educational Chatbot",
  description: "Web-based educational chatbot for personalized learning.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, interactive-widget=resizes-content",
  themeColor: "#0f172a",
};

import { Providers } from '../components/Providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
