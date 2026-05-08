import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import MobileNavbar from "@/components/MobileNavbar";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIDENHUB",
  description: "Explore the Miden ecosystem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white font-sans min-h-screen flex flex-col antialiased relative z-0">
        <BackgroundOrbs />
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col overflow-x-hidden bg-transparent">
            {children}
          </main>
          <MobileNavbar />
        </AuthProvider>
      </body>
    </html>
  );
}
