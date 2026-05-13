import { PrescriptionStatus } from '@prisma/client';

export interface PrescriptionItemRecord {
  id: string;
  name: string;
  dosage: string | null;
  quantity: number | null;
  instructions: string | null;
  sortOrder: number;
}

export interface PrescriptionActorRecord {
  id: string;
  name: string;
  email: string;
  specialty?: string | null;
  licenseNumber?: string | null;
}

export interface PrescriptionRecord {
  id: string;
  code: string;
  status: PrescriptionStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  consumedAt: Date | null;
  patientId: string;
  authorId: string;
  patient: PrescriptionActorRecord;
  author: PrescriptionActorRecord;
  items: PrescriptionItemRecord[];
}

export interface PrescriptionItemInput {
  name: string;
  dosage: string;
  quantity: number;
  instructions: string;
}

export interface CreatePrescriptionInput {
  code: string;
  patientId: string;
  authorId: string;
  notes?: string;
  items: PrescriptionItemInput[];
}

export interface PrescriptionListFilters {
  status?: PrescriptionStatus;
  from?: Date;
  to?: Date;
  doctorId?: string;
  patientId?: string;
  authorId?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'consumedAt';
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedPrescriptions {
  data: PrescriptionRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PrescriptionRepository {
  create(input: CreatePrescriptionInput): Promise<PrescriptionRecord>;
  findById(id: string): Promise<PrescriptionRecord | null>;
  findMany(filters: PrescriptionListFilters): Promise<PaginatedPrescriptions>;
  markAsConsumed(id: string, consumedAt: Date): Promise<PrescriptionRecord>;
  codeExists(code: string): Promise<boolean>;
  resolveDoctorIdByUserId(userId: string): Promise<string | null>;
  resolvePatientIdByUserId(userId: string): Promise<string | null>;
  resolvePatientIdByEmail(email: string): Promise<string | null>;
}
