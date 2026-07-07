"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { system } from "tikin-ds";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
