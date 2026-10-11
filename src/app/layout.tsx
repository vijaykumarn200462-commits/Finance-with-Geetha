import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { UserAuthProvider } from "@/lib/firebase/user-auth";
import { CurrencyProvider } from "@/lib/context/CurrencyContext";

const dmSerif = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://financewithgeetha.com"),
  title: {
    default: "Finance with Geetha | Build a Profitable Bookkeeping Business",
    template: "%s | Finance with Geetha",
  },
  description:
    "Learn how to build a calm, profitable bookkeeping business with practical coaching from Geetha on pricing, clients, onboarding, workflows, and more.",
  keywords: [
    "bookkeeping coaching",
    "start a bookkeeping business",
    "bookkeeper mentorship",
    "accounting software training",
    "bookkeeping pricing",
    "bookkeeping onboarding",
    "calm business",
    "Geetha",
    "Finance with Geetha",
  ],
  authors: [{ name: "Geetha", url: "https://financewithgeetha.com" }],
  creator: "Geetha",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://financewithgeetha.com",
    siteName: "Finance with Geetha",
    title: "Finance with Geetha | Build a Profitable Bookkeeping Business",
    description:
      "Learn how to build a calm, profitable bookkeeping business. Pricing. Discovery calls. Onboarding. The real work. How to talk to clients.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Finance with Geetha — Practical Bookkeeping Coaching",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Finance with Geetha | Build a Profitable Bookkeeping Business",
    description:
      "Learn how to actually build a bookkeeping business. Flat pricing, discovery calls, workflows, and client retention.",
    creator: "@financewithgeetha",
  },
  robots: {
    index: true,
    follow: true,
  },
};


export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${dmSerif.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen flex flex-col font-sans bg-[#FAF7F2] text-[#181918] antialiased selection:bg-[#244634] selection:text-[#FAF7F2]">
        <UserAuthProvider>
          <CurrencyProvider>{children}</CurrencyProvider>
        </UserAuthProvider>
      </body>
    </html>
  );
}
