import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { ServiceWorker } from "@/app/service-worker";

export const metadata: Metadata = {
  title: "DecodeHire",
  description: "Plataforma SaaS para analise de curriculos.",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = { themeColor: "#6d28d9", colorScheme: "light dark" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR" suppressHydrationWarning><body>{children}<Toaster richColors position="top-right"/><ServiceWorker/></body></html>;
}
