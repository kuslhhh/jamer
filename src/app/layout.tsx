import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { UserProvider } from "./store/userStore";
import { AudioProvider } from "./store/AudioContext";
import { Suspense } from "react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Vibe",
  description: "Vote to play next!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense>
          <UserProvider>
            <AudioProvider>
              <Toaster
                position="bottom-left"
                visibleToasts={2}
                toastOptions={{
                  style: { background: "#6750A4" },
                  className: "rounded-xl w-fit text-white border-none",
                }}
              />
              {children}
            </AudioProvider>
          </UserProvider>
        </Suspense>
      </body>
    </html>
  );
}
