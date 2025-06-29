import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToasterClient from "./components/ToasterClient";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DMSM Admin Panel",
  description: "Admin panel for DMSM e-commerce platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToasterClient />
        {children}
      </body>
    </html>
  );
}
