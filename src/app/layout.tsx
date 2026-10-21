import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider }    from "@/providers/Web3Provider";
import { ToastProvider }   from "@/contexts/ToastContext";
import ToastContainer      from "@/components/ui/Toast";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets:  ["latin"],
  display:  "swap",
});

export const metadata: Metadata = {
  title:       "FundChain — Group Payments & Messaging",
  description: "A Web3 super-app for seamless group payments, transparent fund pooling, and real-time messaging. Built on Avalanche for speed, trust, and zero fees.",
  keywords:    ["Group Payments", "Web3", "Fund Pooling", "DApp", "Messaging", "Avalanche", "Blockchain"],
  openGraph: {
    title:       "FundChain — Group Payments & Messaging",
    description: "Collect money transparently, chat instantly, and pay trustlessly with your group.",
    type:        "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="h-full overflow-hidden bg-zinc-950">
        <Web3Provider>
          <ToastProvider>
            {children}
            {/* Global toast notifications — rendered outside app shell so
                they are always visible regardless of which view is active */}
            <ToastContainer />
          </ToastProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
