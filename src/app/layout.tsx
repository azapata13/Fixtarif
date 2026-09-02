import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fixtarif",
  description: "Workspace bilingue pour préparer et valider les expéditions.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
