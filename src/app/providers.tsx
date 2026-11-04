"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { Toaster, system } from "tikin-uai";
import { ConfirmProvider } from "@/components/common/ConfirmProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { HideValuesProvider } from "@/contexts/HideValuesContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ConfirmProvider>
        <AuthProvider>
          <HideValuesProvider>{children}</HideValuesProvider>
          <Toaster />
        </AuthProvider>
      </ConfirmProvider>
    </ChakraProvider>
  );
}
