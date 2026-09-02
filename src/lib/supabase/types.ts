export type WorkspaceRole = "owner" | "admin" | "member";
export type MemberStatus = "active" | "invited" | "disabled";

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
    };
    CompositeTypes: Record<string, never>;
  };
};
