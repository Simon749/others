"use client";

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner";

export default function ClientWrapper({ children }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Toaster />
      {children}
    </ThemeProvider>
  );
}