export interface AuthenticatedPrincipal {
  userId: string;
  email: string;
  organizationId?: string;
  permissions: readonly string[];
  sessionId?: string;
}

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  principal?: AuthenticatedPrincipal;
}
