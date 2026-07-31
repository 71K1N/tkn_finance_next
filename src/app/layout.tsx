import type { Metadata } from "next";
import { Roboto, Montserrat } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import FloatingActionButton from "@/components/FloatingActionButton"
import Providers from "./providers";
import { Box } from "@chakra-ui/react";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

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
    <html lang="pt-BR" className={`${roboto.variable} ${montserrat.variable}`}>
      <body>
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
