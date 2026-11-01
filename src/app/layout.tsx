import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import "./theme-and-motion.css";

const sora = Sora({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sora" });

export const metadata: Metadata = {
  title: "Qitaf Insights",
  description: "Qitaf employee rewards survey results",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Applies the saved theme before first paint so there is no flash of the wrong theme.
const themeScript = `try{var t=localStorage.getItem('qitaf-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sora.variable} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
