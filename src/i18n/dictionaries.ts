import type { Locale } from "@/i18n/config";

export type Dictionary = {
  auth: {
    email: string;
    password: string;
    signIn: string;
    signInWithGoogle: string;
    signUp: string;
    signOut: string;
    subtitle: string;
    title: string;
  };
  common: {
    loading: string;
    workspace: string;
  };
  nav: Record<"dashboard" | "shipments" | "products" | "companies" | "carriers" | "brokers" | "documents" | "team" | "settings" | "admin", string>;
  onboarding: {
    create: string;
    legalName: string;
    name: string;
    title: string;
  };
  pages: Record<string, { title: string; description: string }>;
};

const dictionaries: Record<Locale, Dictionary> = {
  fr: {
    auth: {
      email: "Courriel",
      password: "Mot de passe",
      signIn: "Connexion",
      signInWithGoogle: "Continuer avec Google",
      signUp: "Créer un compte",
      signOut: "Déconnexion",
      subtitle: "Connectez-vous pour accéder à votre workspace Fixtarif.",
      title: "Connexion sécurisée",
    },
    common: {
      loading: "Chargement",
      workspace: "Workspace",
    },
    nav: {
      dashboard: "Tableau",
      shipments: "Expéditions",
      products: "Produits",
      companies: "Entreprises",
      carriers: "Transporteurs",
      brokers: "Courtiers",
      documents: "Documents",
      team: "Équipe",
      settings: "Réglages",
      admin: "Admin",
    },
    onboarding: {
      create: "Créer le workspace",
      legalName: "Nom légal",
      name: "Nom du workspace",
      title: "Créer votre premier workspace",
    },
    pages: {
      dashboard: {
        title: "Tableau de bord",
        description: "Vue privée du workspace avec les raccourcis de travail.",
      },
      shipments: {
        title: "Expéditions",
        description: "Brouillons Canada/USA, validation, duplication et préparation documentaire.",
      },
      products: {
        title: "Produits",
        description: "Bibliothèque produit avec dimensions, valeurs et validation HTS USA.",
      },
      companies: {
        title: "Entreprises",
        description: "Clients, fournisseurs, sites de livraison et contacts de réception.",
      },
      carriers: {
        title: "Transporteurs",
        description: "Transporteurs, préférences BOL et coordonnées de dispatch.",
      },
      brokers: {
        title: "Courtiers",
        description: "Courtiers USA préparés pour les flux douaniers à validation humaine.",
      },
      documents: {
        title: "Documents",
        description: "Documents sources privés et PDF brouillons générés après validation.",
      },
      team: {
        title: "Équipe",
        description: "Gestion des rôles owner, admin et member.",
      },
      settings: {
        title: "Réglages",
        description: "Préférences workspace, langue, unités et références.",
      },
      admin: {
        title: "Administration du workspace",
        description: "Vue propriétaire du workspace client, des rôles et des contrôles de sécurité.",
      },
    },
  },
  en: {
    auth: {
      email: "Email",
      password: "Password",
      signIn: "Sign in",
      signInWithGoogle: "Continue with Google",
      signUp: "Create account",
      signOut: "Sign out",
      subtitle: "Sign in to access your Fixtarif workspace.",
      title: "Secure sign in",
    },
    common: {
      loading: "Loading",
      workspace: "Workspace",
    },
    nav: {
      dashboard: "Dashboard",
      shipments: "Shipments",
      products: "Products",
      companies: "Companies",
      carriers: "Carriers",
      brokers: "Brokers",
      documents: "Documents",
      team: "Team",
      settings: "Settings",
      admin: "Admin",
    },
    onboarding: {
      create: "Create workspace",
      legalName: "Legal name",
      name: "Workspace name",
      title: "Create your first workspace",
    },
    pages: {
      dashboard: {
        title: "Dashboard",
        description: "Private workspace view with work shortcuts.",
      },
      shipments: {
        title: "Shipments",
        description: "Canada/USA drafts, validation, duplication and document preparation.",
      },
      products: {
        title: "Products",
        description: "Product library with dimensions, values and US HTS validation.",
      },
      companies: {
        title: "Companies",
        description: "Customers, suppliers, delivery sites and receiving contacts.",
      },
      carriers: {
        title: "Carriers",
        description: "Carrier records, BOL preferences and dispatch details.",
      },
      brokers: {
        title: "Brokers",
        description: "US brokers prepared for customs workflows with human validation.",
      },
      documents: {
        title: "Documents",
        description: "Private source documents and draft PDFs generated after validation.",
      },
      team: {
        title: "Team",
        description: "Role management for owner, admin and member.",
      },
      settings: {
        title: "Settings",
        description: "Workspace preferences, language, units and references.",
      },
      admin: {
        title: "Workspace administration",
        description: "Owner view for the client workspace, roles and security controls.",
      },
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
