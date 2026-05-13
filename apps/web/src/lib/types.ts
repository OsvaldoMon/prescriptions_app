export type Role = 'admin' | 'doctor' | 'patient';
export type PrescriptionStatus = 'pending' | 'consumed';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: Role;
  doctorId: string | null;
  patientId: string | null;
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string | null;
  quantity: number | null;
  instructions: string | null;
  sortOrder: number;
}

export interface PrescriptionActor {
  id: string;
  name: string;
  email: string;
  specialty?: string | null;
  licenseNumber?: string | null;
}

export interface Prescription {
  id: string;
  code: string;
  status: PrescriptionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  consumedAt: string | null;
  patientId: string;
  authorId: string;
  patient: PrescriptionActor;
  author: PrescriptionActor;
  items: PrescriptionItem[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminMetrics {
  totals: {
    doctors: number;
    patients: number;
    prescriptions: number;
  };
  byStatus: {
    pending: number;
    consumed: number;
  };
  byDay: Array<{
    date: string;
    count: number;
  }>;
  topDoctors: Array<{
    doctorId: string;
    doctorName: string;
    count: number;
  }>;
}

export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}
