import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fixtarif",
  description: "Workspace bilingue pour préparer et valider les expéditions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
