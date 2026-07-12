"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { system } from "tikin-ds";
import { HideValuesProvider } from "@/contexts/HideValuesContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <HideValuesProvider>{children}</HideValuesProvider>
    </ChakraProvider>
  );
}
