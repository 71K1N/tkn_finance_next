import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./core.css";
import Navbar from "./components/navbar";
import FloatingActionButton from './components/FloatingActionButton'
import Link from "next/link";
import { Activity, ShoppingBag } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "e-TKN Fin Lite",
  description: "Personal finances",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Navbar/>
        <div className="container">
          {children}
        </div>
        <FloatingActionButton />
      </body>
    </html>
  );
}
