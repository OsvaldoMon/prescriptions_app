import { apiDownload, apiRequest } from '@/lib/api/client';
import { buildQueryStringFromObject } from '@/lib/api/query';
import type { PaginatedResponse, Prescription } from '@/lib/types';

export interface PrescriptionFilters {
  page?: number;
  limit?: number;
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  order?: string;
}

export interface CreatePrescriptionPayload {
  patientId?: string;
  patientEmail?: string;
  notes?: string;
  items: Array<{
    name: string;
    dosage: string;
    quantity: number;
    instructions: string;
  }>;
}

export function listDoctorPrescriptions(
  filters: PrescriptionFilters,
): Promise<PaginatedResponse<Prescription>> {
  return apiRequest<PaginatedResponse<Prescription>>(
    `/prescriptions${buildQueryStringFromObject({ ...filters, mine: true })}`,
  );
}

export function listPatientPrescriptions(
  filters: PrescriptionFilters,
): Promise<PaginatedResponse<Prescription>> {
  return apiRequest<PaginatedResponse<Prescription>>(
    `/me/prescriptions${buildQueryStringFromObject(filters)}`,
  );
}

export function listAdminPrescriptions(
  filters: PrescriptionFilters & { doctorId?: string; patientId?: string },
): Promise<PaginatedResponse<Prescription>> {
  return apiRequest<PaginatedResponse<Prescription>>(
    `/admin/prescriptions${buildQueryStringFromObject(filters)}`,
  );
}

export function getPrescription(id: string): Promise<Prescription> {
  return apiRequest<Prescription>(`/prescriptions/${id}`);
}

export function createPrescription(
  payload: CreatePrescriptionPayload,
): Promise<Prescription> {
  return apiRequest<Prescription>('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function consumePrescription(id: string): Promise<Prescription> {
  return apiRequest<Prescription>(`/prescriptions/${id}/consume`, {
    method: 'PUT',
    body: JSON.stringify({ consumed: true }),
  });
}

export function downloadPrescriptionPdf(id: string): Promise<Blob> {
  return apiDownload(`/prescriptions/${id}/pdf`);
}
