export interface PrescriptionPdfItem {
  name: string;
  dosage?: string | null;
  quantity?: number | null;
  instructions?: string | null;
}

export interface PrescriptionPdfData {
  code: string;
  status: string;
  notes?: string | null;
  createdAt: Date;
  consumedAt?: Date | null;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorSpecialty?: string | null;
  doctorLicenseNumber?: string | null;
  items: PrescriptionPdfItem[];
  verificationUrl: string;
}

export interface PrescriptionPdfStrategy {
  generate(data: PrescriptionPdfData): Promise<Buffer>;
}
