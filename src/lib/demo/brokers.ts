export type DemoBroker = {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  isDefaultUsa: boolean;
  notes: string;
};

export const demoBrokers: DemoBroker[] = [
  {
    name: "Frontier Customs Services",
    contactName: "Rachel Moore",
    email: "entries@frontier-customs.test",
    phone: "716 555-0199",
    address: "100 Customs Plaza, Buffalo, NY",
    isDefaultUsa: true,
    notes: "Courtier de test pour valider le workflow USA plus tard.",
  },
  {
    name: "Pont Nord Brokerage",
    contactName: "Marc Gagnon",
    email: "ops@pontnord-brokerage.test",
    phone: "450 555-0161",
    address: "200 Route Frontière, Saint-Bernard-de-Lacolle, QC",
    isDefaultUsa: false,
    notes: "Courtier canadien de test. Aucune règle douanière automatisée.",
  },
];
