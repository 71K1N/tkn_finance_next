import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import FloatingActionButton from "@/components/FloatingActionButton"
import Providers from "./providers";
import { Box } from "@chakra-ui/react";

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
        <Providers>
          <Sidebar />
          <Box className="container" bg="bg.canvas" ml={{ base: 0, md: "sidebar" }}>
            {children}
          </Box>
          <FloatingActionButton />
        </Providers>
      </body>
    </html>
  );
}
