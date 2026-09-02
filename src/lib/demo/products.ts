import type { PackageType } from "@/lib/supabase/types";

export type DemoProduct = {
  name: string;
  partNumber: string;
  descriptionFr: string;
  descriptionEn: string;
  weight: number;
  weightUnit: "lb" | "kg";
  length: number;
  width: number;
  height: number;
  dimensionUnit: "in" | "cm";
  packageType: PackageType;
  stackable: boolean;
  defaultValue: number;
  currency: "CAD" | "USD";
  notes: string;
};

export const demoProducts: DemoProduct[] = [
  {
    name: "Idler Assembly",
    partNumber: "ID-43567",
    descriptionFr: "Assemblage idler emballé sur palette.",
    descriptionEn: "Idler assembly packed on pallet.",
    weight: 250,
    weightUnit: "lb",
    length: 48,
    width: 40,
    height: 36,
    dimensionUnit: "in",
    packageType: "pallet",
    stackable: false,
    defaultValue: 1800,
    currency: "CAD",
    notes: "Poids et quantité doivent être confirmés pour chaque expédition.",
  },
  {
    name: "Machined Support Bracket",
    partNumber: "BR-1204",
    descriptionFr: "Support usiné emballé en caisse.",
    descriptionEn: "Machined support bracket packed in crate.",
    weight: 84,
    weightUnit: "lb",
    length: 24,
    width: 18,
    height: 14,
    dimensionUnit: "in",
    packageType: "crate",
    stackable: true,
    defaultValue: 640,
    currency: "CAD",
    notes: "Description logistique seulement. Aucune donnée douanière validée.",
  },
];
