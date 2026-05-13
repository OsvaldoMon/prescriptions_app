import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PrescriptionStatus, Role } from '@prisma/client';
import { PrescriptionService } from './prescription.service';
import type { PrescriptionRepository } from '../domain/repositories/prescription.repository';
import type { AuditLogRepository } from '../domain/repositories/audit-log.repository';
import type { PrescriptionPdfStrategy } from '../domain/strategies/prescription-pdf.strategy';
import { PrescriptionCodeGenerator } from './prescription-code.generator';

describe('PrescriptionService', () => {
  let prescriptionService: PrescriptionService;
  let prescriptionRepository: jest.Mocked<PrescriptionRepository>;
  let auditLogRepository: jest.Mocked<AuditLogRepository>;
  let prescriptionPdfStrategy: jest.Mocked<PrescriptionPdfStrategy>;
  let prescriptionCodeGenerator: jest.Mocked<PrescriptionCodeGenerator>;

  const prescription = {
    id: 'rx-1',
    code: 'RX-2026-AAA',
    status: PrescriptionStatus.pending,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    consumedAt: null,
    patientId: 'patient-1',
    authorId: 'doctor-1',
    patient: {
      id: 'patient-1',
      name: 'Paciente',
      email: 'patient@test.com',
    },
    author: {
      id: 'doctor-1',
      name: 'Doctor',
      email: 'dr@test.com',
      specialty: 'General',
      licenseNumber: 'MED-1',
    },
    items: [],
  };

  beforeEach(() => {
    prescriptionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      markAsConsumed: jest.fn(),
      codeExists: jest.fn(),
      resolveDoctorIdByUserId: jest.fn(),
      resolvePatientIdByUserId: jest.fn(),
      resolvePatientIdByEmail: jest.fn(),
    };
    auditLogRepository = {
      create: jest.fn(),
    };
    prescriptionPdfStrategy = {
      generate: jest.fn(),
    };
    prescriptionCodeGenerator = {
      generate: jest.fn(),
    } as unknown as jest.Mocked<PrescriptionCodeGenerator>;

    prescriptionService = new PrescriptionService(
      prescriptionRepository,
      auditLogRepository,
      prescriptionPdfStrategy,
      prescriptionCodeGenerator,
      {
        get: jest.fn().mockReturnValue('http://localhost:3001'),
      } as never,
    );
  });

  it('impide consumir prescripciones de otro paciente', async () => {
    prescriptionRepository.resolvePatientIdByUserId.mockResolvedValue(
      'patient-2',
    );
    prescriptionRepository.findById.mockResolvedValue(prescription);

    await expect(
      prescriptionService.consume(
        { id: 'user-2', email: 'other@test.com', role: Role.patient },
        'rx-1',
        { consumed: true },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza consumir una prescripción ya consumida', async () => {
    prescriptionRepository.resolvePatientIdByUserId.mockResolvedValue(
      'patient-1',
    );
    prescriptionRepository.findById.mockResolvedValue({
      ...prescription,
      status: PrescriptionStatus.consumed,
    });

    await expect(
      prescriptionService.consume(
        { id: 'user-1', email: 'patient@test.com', role: Role.patient },
        'rx-1',
        { consumed: true },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
