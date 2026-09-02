export type DemoClient = {
  name: string;
  role: string;
  city: string;
  region: string;
  contact: string;
  email: string;
  phone: string;
  notes: string;
};

export const demoClients: DemoClient[] = [
  {
    name: "Atelier Nordik",
    role: "Client",
    city: "Trois-Rivières",
    region: "QC",
    contact: "Sophie Lambert",
    email: "reception@atelier-nordik.test",
    phone: "819 555-0134",
    notes: "Réception avec quai. Appeler 30 minutes avant livraison.",
  },
  {
    name: "Great Lakes Fabrication",
    role: "Client USA",
    city: "Buffalo",
    region: "NY",
    contact: "Michael Turner",
    email: "shipping@greatlakes-fab.test",
    phone: "716 555-0188",
    notes: "Acheteur identique au lieu de livraison pour les tests.",
  },
];
