"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { Toaster, system } from "tikin-uai";
import { AuthProvider } from "@/contexts/AuthContext";
import { HideValuesProvider } from "@/contexts/HideValuesContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <AuthProvider>
        <HideValuesProvider>{children}</HideValuesProvider>
        <Toaster />
      </AuthProvider>
    </ChakraProvider>
  );
}
