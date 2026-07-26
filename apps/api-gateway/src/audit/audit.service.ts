import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";

export interface AuditRecord {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: "success" | "denied" | "failure";
  occurredAt: string;
  metadata: Readonly<Record<string, string | number | boolean>>;
}

@Injectable()
export class AuditService {
  private readonly records: AuditRecord[] = [];

  append(
    record: Omit<AuditRecord, "id" | "occurredAt">,
  ): Readonly<AuditRecord> {
    const persisted: AuditRecord = {
      ...record,
      id: randomUUID(),
      occurredAt: new Date().toISOString(),
      metadata: Object.freeze({ ...record.metadata }),
    };
    this.records.push(Object.freeze(persisted));
    return persisted;
  }

  forTenant(tenantId: string): readonly AuditRecord[] {
    return this.records.filter((record) => record.tenantId === tenantId);
  }
}
