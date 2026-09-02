export type WorkspaceRole = "owner" | "admin" | "member";
export type MemberStatus = "active" | "invited" | "disabled";
export type BusinessRole = "client" | "supplier" | "subcontractor" | "consignee" | "buyer" | "other";
export type ContactType = "commercial" | "receiving" | "shipping" | "project" | "accounting" | "other";
export type PackageType = "pallet" | "box" | "crate" | "bundle" | "drum" | "other";
export type CarrierType = "ltl" | "ftl" | "flatbed" | "parcel" | "other";
export type ShipmentStatus = "draft" | "validation" | "ready" | "archived";
export type ShipmentReason = "sale" | "subcontracting" | "repair" | "treatment" | "return_rma" | "sample_test" | "loaned_material" | "tools_return" | "other";
export type PaymentTerm = "prepaid" | "collect" | "third_party";

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          status: MemberStatus;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: WorkspaceRole;
          status?: MemberStatus;
          created_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: WorkspaceRole;
          status?: MemberStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      company_profiles: {
        Row: {
          id: string;
          workspace_id: string;
          legal_name: string;
          trade_name: string | null;
          address: string | null;
          city: string | null;
          region: string | null;
          postal_code: string | null;
          country: string;
          phone: string | null;
          email: string | null;
          tax_number: string | null;
          language: "fr" | "en";
          weight_unit: "lb" | "kg";
          dimension_unit: "in" | "cm";
          currency: "CAD" | "USD";
          reference_format: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          legal_name: string;
          trade_name?: string | null;
          address?: string | null;
          city?: string | null;
          region?: string | null;
          postal_code?: string | null;
          country?: string;
          phone?: string | null;
          email?: string | null;
          tax_number?: string | null;
          language?: "fr" | "en";
          weight_unit?: "lb" | "kg";
          dimension_unit?: "in" | "cm";
          currency?: "CAD" | "USD";
          reference_format?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          legal_name?: string;
          trade_name?: string | null;
          address?: string | null;
          city?: string | null;
          region?: string | null;
          postal_code?: string | null;
          country?: string;
          phone?: string | null;
          email?: string | null;
          tax_number?: string | null;
          language?: "fr" | "en";
          weight_unit?: "lb" | "kg";
          dimension_unit?: "in" | "cm";
          currency?: "CAD" | "USD";
          reference_format?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_profiles_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          tax_number: string | null;
          email: string | null;
          phone: string | null;
          roles: BusinessRole[];
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          tax_number?: string | null;
          email?: string | null;
          phone?: string | null;
          roles?: BusinessRole[];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          tax_number?: string | null;
          email?: string | null;
          phone?: string | null;
          roles?: BusinessRole[];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      business_sites: {
        Row: {
          id: string;
          workspace_id: string;
          business_id: string;
          name: string;
          address: string | null;
          city: string | null;
          region: string | null;
          postal_code: string | null;
          country: string;
          opening_time: string | null;
          closing_time: string | null;
          dock_info: string | null;
          flatbed_required: boolean;
          appointment_required: boolean;
          call_before_minutes: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          business_id: string;
          name?: string;
          address?: string | null;
          city?: string | null;
          region?: string | null;
          postal_code?: string | null;
          country?: string;
          opening_time?: string | null;
          closing_time?: string | null;
          dock_info?: string | null;
          flatbed_required?: boolean;
          appointment_required?: boolean;
          call_before_minutes?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          business_id?: string;
          name?: string;
          address?: string | null;
          city?: string | null;
          region?: string | null;
          postal_code?: string | null;
          country?: string;
          opening_time?: string | null;
          closing_time?: string | null;
          dock_info?: string | null;
          flatbed_required?: boolean;
          appointment_required?: boolean;
          call_before_minutes?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_sites_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_sites_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          id: string;
          workspace_id: string;
          business_id: string;
          site_id: string | null;
          name: string;
          role: string | null;
          email: string | null;
          phone: string | null;
          extension: string | null;
          contact_type: ContactType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          business_id: string;
          site_id?: string | null;
          name: string;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          extension?: string | null;
          contact_type?: ContactType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          business_id?: string;
          site_id?: string | null;
          name?: string;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          extension?: string | null;
          contact_type?: ContactType;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "business_sites";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          part_number: string | null;
          description_fr: string | null;
          description_en: string | null;
          weight: number | null;
          weight_unit: "lb" | "kg";
          length: number | null;
          width: number | null;
          height: number | null;
          dimension_unit: "in" | "cm";
          default_package_type: PackageType;
          stackable: boolean | null;
          default_value: number | null;
          currency: "CAD" | "USD";
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          part_number?: string | null;
          description_fr?: string | null;
          description_en?: string | null;
          weight?: number | null;
          weight_unit?: "lb" | "kg";
          length?: number | null;
          width?: number | null;
          height?: number | null;
          dimension_unit?: "in" | "cm";
          default_package_type?: PackageType;
          stackable?: boolean | null;
          default_value?: number | null;
          currency?: "CAD" | "USD";
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          part_number?: string | null;
          description_fr?: string | null;
          description_en?: string | null;
          weight?: number | null;
          weight_unit?: "lb" | "kg";
          length?: number | null;
          width?: number | null;
          height?: number | null;
          dimension_unit?: "in" | "cm";
          default_package_type?: PackageType;
          stackable?: boolean | null;
          default_value?: number | null;
          currency?: "CAD" | "USD";
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      carriers: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          carrier_type: CarrierType;
          email: string | null;
          phone: string | null;
          default_provides_bol: boolean;
          notes: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          carrier_type?: CarrierType;
          email?: string | null;
          phone?: string | null;
          default_provides_bol?: boolean;
          notes?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          carrier_type?: CarrierType;
          email?: string | null;
          phone?: string | null;
          default_provides_bol?: boolean;
          notes?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carriers_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      brokers: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          is_default_usa: boolean;
          notes: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          is_default_usa?: boolean;
          notes?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          is_default_usa?: boolean;
          notes?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brokers_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      shipments: {
        Row: {
          id: string;
          workspace_id: string;
          reference: string;
          shipment_date: string;
          destination_country: "CA" | "US";
          reason: ShipmentReason;
          language: "fr" | "en";
          status: ShipmentStatus;
          created_by: string;
          destination_business_id: string | null;
          destination_site_id: string | null;
          destination_contact_id: string | null;
          carrier_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          reference: string;
          shipment_date?: string;
          destination_country?: "CA" | "US";
          reason?: ShipmentReason;
          language?: "fr" | "en";
          status?: ShipmentStatus;
          created_by: string;
          destination_business_id?: string | null;
          destination_site_id?: string | null;
          destination_contact_id?: string | null;
          carrier_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipments"]["Insert"]>;
        Relationships: [];
      };
      shipment_items: {
        Row: {
          id: string;
          workspace_id: string;
          shipment_id: string;
          product_id: string | null;
          product_snapshot_json: Record<string, unknown>;
          name: string;
          part_number: string | null;
          quantity: number;
          quantity_confirmed: boolean;
          weight: number;
          weight_unit: "lb" | "kg";
          weight_confirmed: boolean;
          length: number | null;
          width: number | null;
          height: number | null;
          dimension_unit: "in" | "cm";
          package_type: PackageType;
          lot_number: string | null;
          container_reference: string | null;
          release_note_reference: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          shipment_id: string;
          product_id?: string | null;
          product_snapshot_json?: Record<string, unknown>;
          name: string;
          part_number?: string | null;
          quantity: number;
          quantity_confirmed?: boolean;
          weight: number;
          weight_unit?: "lb" | "kg";
          weight_confirmed?: boolean;
          length?: number | null;
          width?: number | null;
          height?: number | null;
          dimension_unit?: "in" | "cm";
          package_type?: PackageType;
          lot_number?: string | null;
          container_reference?: string | null;
          release_note_reference?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipment_items"]["Insert"]>;
        Relationships: [];
      };
      shipment_transport: {
        Row: {
          id: string;
          workspace_id: string;
          shipment_id: string;
          carrier_id: string | null;
          carrier_snapshot_json: Record<string, unknown>;
          pro_number: string | null;
          bol_number: string | null;
          payment_term: PaymentTerm;
          needs_bol: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          shipment_id: string;
          carrier_id?: string | null;
          carrier_snapshot_json?: Record<string, unknown>;
          pro_number?: string | null;
          bol_number?: string | null;
          payment_term?: PaymentTerm;
          needs_bol?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipment_transport"]["Insert"]>;
        Relationships: [];
      };
      shipment_packages: {
        Row: {
          id: string;
          workspace_id: string;
          shipment_id: string;
          package_number: number;
          package_count: number;
          package_type: PackageType;
          weight: number | null;
          weight_unit: "lb" | "kg";
          length: number | null;
          width: number | null;
          height: number | null;
          dimension_unit: "in" | "cm";
          stackable: boolean | null;
          destination_label: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          shipment_id: string;
          package_number?: number;
          package_count?: number;
          package_type?: PackageType;
          weight?: number | null;
          weight_unit?: "lb" | "kg";
          length?: number | null;
          width?: number | null;
          height?: number | null;
          dimension_unit?: "in" | "cm";
          stackable?: boolean | null;
          destination_label?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipment_packages"]["Insert"]>;
        Relationships: [];
      };
      shipment_audit_log: {
        Row: {
          id: string;
          workspace_id: string;
          shipment_id: string | null;
          actor_user_id: string | null;
          action: string;
          metadata_json: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          shipment_id?: string | null;
          actor_user_id?: string | null;
          action: string;
          metadata_json?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipment_audit_log"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_workspace_with_owner: {
        Args: {
          workspace_name: string;
        };
        Returns: string;
      };
    };
    Enums: {
      workspace_role: WorkspaceRole;
      member_status: MemberStatus;
      business_role: BusinessRole;
      contact_type: ContactType;
      package_type: PackageType;
      carrier_type: CarrierType;
      shipment_status: ShipmentStatus;
      shipment_reason: ShipmentReason;
      payment_term: PaymentTerm;
    };
    CompositeTypes: Record<string, never>;
  };
};
