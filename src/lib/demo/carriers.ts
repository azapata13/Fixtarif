import type { CarrierType } from "@/lib/supabase/types";

export type DemoCarrier = {
  name: string;
  carrierType: CarrierType;
  email: string;
  phone: string;
  defaultProvidesBol: boolean;
  notes: string;
};

export const demoCarriers: DemoCarrier[] = [
  {
    name: "Nordik Transport",
    carrierType: "ltl",
    email: "dispatch@nordik-transport.test",
    phone: "514 555-0177",
    defaultProvidesBol: false,
    notes: "Transporteur LTL de test pour expéditions Canada.",
  },
  {
    name: "Lakeside Freight",
    carrierType: "ftl",
    email: "ops@lakeside-freight.test",
    phone: "716 555-0142",
    defaultProvidesBol: true,
    notes: "Transporteur USA de test. Fournit généralement son propre BOL.",
  },
];
