import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Merchy — Forecast smarter", description: "AI inventory and demand forecasting" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
