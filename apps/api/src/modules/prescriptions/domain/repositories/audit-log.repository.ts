import { AuditAction } from '@prisma/client';

export interface CreateAuditLogInput {
  entityType: string;
  entityId: string;
  action: AuditAction;
  actorId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRepository {
  create(input: CreateAuditLogInput): Promise<void>;
}
