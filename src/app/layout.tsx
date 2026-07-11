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
          {/* ml uses literal px, not the "sidebar"/"sidebar-mini" tokens: those are sizes-scale tokens and margin props read from the spacing scale, so the token names don't resolve here */}
          <Box bg="bg.canvas" ml={{ base: 0, md: "72px", lg: "260px" }}>
            {children}
          </Box>
          <FloatingActionButton />
        </Providers>
      </body>
    </html>
  );
}
