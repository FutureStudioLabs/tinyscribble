import { AuthBroadcastListener } from "@/components/auth/AuthBroadcastListener";
import type { Metadata } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TinyScribble — Bring Your Child's Drawing to Life",
  description: "Where drawings come alive. Transform your child's drawing into a photorealistic CGI image and animate it into a short cinematic video.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthBroadcastListener />
        {children}
      </body>
    </html>
  );
}
