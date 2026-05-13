import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { QueryProvider } from "@/lib/QueryProvider";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Mongolia Road Trip — Plan your route across the steppe",
  description:
    "Plan A-to-B road trips in Mongolia. Discover fuel stops, cafes, hotels, camps, and scenic viewpoints along any route.",
  icons: { icon: "/favicon.ico" },
};

type RootLayoutProps = { children: React.ReactNode };

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en" className={display.variable}>
    <head>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
      />
    </head>
    <body className="bg-canvas text-foreground antialiased">
      <QueryProvider>{children}</QueryProvider>
    </body>
  </html>
);

export default RootLayout;
