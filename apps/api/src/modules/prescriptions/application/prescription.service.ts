import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, PrescriptionStatus, Role } from '@prisma/client';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import {
  AUDIT_LOG_REPOSITORY,
  PRESCRIPTION_PDF_STRATEGY,
  PRESCRIPTION_REPOSITORY,
} from '../../../common/tokens/injection.tokens';
import type { AuditLogRepository } from '../domain/repositories/audit-log.repository';
import type {
  PaginatedPrescriptions,
  PrescriptionRecord,
  PrescriptionRepository,
} from '../domain/repositories/prescription.repository';
import type { PrescriptionPdfStrategy } from '../domain/strategies/prescription-pdf.strategy';
import { ConsumePrescriptionDto } from '../dto/consume-prescription.dto';
import {
  CreatePrescriptionDto,
  DoctorPrescriptionListQueryDto,
  PrescriptionListQueryDto,
} from '../dto/prescription.dto';
import { PrescriptionCodeGenerator } from './prescription-code.generator';

@Injectable()
export class PrescriptionService {
  constructor(
    @Inject(PRESCRIPTION_REPOSITORY)
    private readonly prescriptionRepository: PrescriptionRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepository,
    @Inject(PRESCRIPTION_PDF_STRATEGY)
    private readonly prescriptionPdfStrategy: PrescriptionPdfStrategy,
    private readonly prescriptionCodeGenerator: PrescriptionCodeGenerator,
    private readonly configService: ConfigService,
  ) {}

  async create(
    user: AuthenticatedUser,
    createDto: CreatePrescriptionDto,
  ): Promise<PrescriptionRecord> {
    const authorId = await this.prescriptionRepository.resolveDoctorIdByUserId(
      user.id,
    );

    if (!authorId) {
      throw new ForbiddenException('Solo los médicos pueden crear prescripciones.');
    }

    const patientId = await this.resolvePatientId(createDto);

    if (!patientId) {
      throw new NotFoundException('Paciente no encontrado.');
    }

    if (!createDto.items.length) {
      throw new BadRequestException('La prescripción debe incluir al menos un ítem.');
    }

    const code = await this.prescriptionCodeGenerator.generate();

    const prescription = await this.prescriptionRepository.create({
      code,
      patientId,
      authorId,
      notes: createDto.notes,
      items: createDto.items,
    });

    await this.auditLogRepository.create({
      entityType: 'Prescription',
      entityId: prescription.id,
      action: AuditAction.created,
      actorId: user.id,
      metadata: {
        code: prescription.code,
        patientId,
        authorId,
      },
    });

    return prescription;
  }

  async listForDoctor(
    user: AuthenticatedUser,
    query: DoctorPrescriptionListQueryDto,
  ): Promise<PaginatedPrescriptions> {
    const authorId = await this.prescriptionRepository.resolveDoctorIdByUserId(
      user.id,
    );

    if (!authorId) {
      throw new ForbiddenException('Perfil de médico no encontrado.');
    }

    const sort = this.parseSort(query.order);

    return this.prescriptionRepository.findMany({
      status: query.status,
      from: query.from,
      to: query.to,
      search: query.search,
      authorId: query.mine === false ? undefined : authorId,
      page: query.page,
      limit: query.limit,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    });
  }

  async listForPatient(
    user: AuthenticatedUser,
    query: PrescriptionListQueryDto,
  ): Promise<PaginatedPrescriptions> {
    const patientId = await this.prescriptionRepository.resolvePatientIdByUserId(
      user.id,
    );

    if (!patientId) {
      throw new ForbiddenException('Perfil de paciente no encontrado.');
    }

    const sort = this.parseSort(query.order);

    return this.prescriptionRepository.findMany({
      status: query.status,
      from: query.from,
      to: query.to,
      search: query.search,
      patientId,
      page: query.page,
      limit: query.limit,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    });
  }

  async listForAdmin(
    query: PrescriptionListQueryDto,
  ): Promise<PaginatedPrescriptions> {
    const sort = this.parseSort(query.order);

    return this.prescriptionRepository.findMany({
      status: query.status,
      from: query.from,
      to: query.to,
      search: query.search,
      doctorId: query.doctorId,
      patientId: query.patientId,
      page: query.page,
      limit: query.limit,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    });
  }

  async getById(
    user: AuthenticatedUser,
    prescriptionId: string,
  ): Promise<PrescriptionRecord> {
    const prescription = await this.prescriptionRepository.findById(
      prescriptionId,
    );

    if (!prescription) {
      throw new NotFoundException('Prescripción no encontrada.');
    }

    await this.assertCanAccess(user, prescription);
    return prescription;
  }

  async consume(
    user: AuthenticatedUser,
    prescriptionId: string,
    consumeDto: ConsumePrescriptionDto,
  ): Promise<PrescriptionRecord> {
    if (!consumeDto.consumed) {
      throw new BadRequestException('Solo se admite marcar la prescripción como consumida.');
    }

    const patientId = await this.prescriptionRepository.resolvePatientIdByUserId(
      user.id,
    );

    if (!patientId) {
      throw new ForbiddenException('Solo los pacientes pueden consumir prescripciones.');
    }

    const prescription = await this.prescriptionRepository.findById(
      prescriptionId,
    );

    if (!prescription) {
      throw new NotFoundException('Prescripción no encontrada.');
    }

    if (prescription.patientId !== patientId) {
      throw new ForbiddenException('No puedes modificar esta prescripción.');
    }

    if (prescription.status === PrescriptionStatus.consumed) {
      throw new ConflictException('La prescripción ya fue marcada como consumida.');
    }

    const consumedAt = new Date();
    const updatedPrescription = await this.prescriptionRepository.markAsConsumed(
      prescriptionId,
      consumedAt,
    );

    await this.auditLogRepository.create({
      entityType: 'Prescription',
      entityId: prescriptionId,
      action: AuditAction.consumed,
      actorId: user.id,
      metadata: {
        code: prescription.code,
        consumedAt: consumedAt.toISOString(),
      },
    });

    return updatedPrescription;
  }

  async generatePdf(
    user: AuthenticatedUser,
    prescriptionId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    if (user.role !== Role.patient) {
      throw new ForbiddenException('Solo el paciente puede descargar el PDF.');
    }

    const prescription = await this.getById(user, prescriptionId);
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
    const verificationUrl = `${frontendUrl.replace(/\/$/, '')}/patient/prescriptions/${prescription.id}`;
    const buffer = await this.prescriptionPdfStrategy.generate({
      code: prescription.code,
      status: prescription.status,
      notes: prescription.notes,
      createdAt: prescription.createdAt,
      consumedAt: prescription.consumedAt,
      patientName: prescription.patient.name,
      patientEmail: prescription.patient.email,
      doctorName: prescription.author.name,
      doctorSpecialty: prescription.author.specialty,
      doctorLicenseNumber: prescription.author.licenseNumber,
      items: prescription.items,
      verificationUrl,
    });

    return {
      buffer,
      filename: `${prescription.code}.pdf`,
    };
  }

  private async resolvePatientId(
    createDto: CreatePrescriptionDto,
  ): Promise<string | null> {
    if (createDto.patientId) {
      return createDto.patientId;
    }

    if (createDto.patientEmail) {
      return this.prescriptionRepository.resolvePatientIdByEmail(
        createDto.patientEmail,
      );
    }

    throw new BadRequestException('Debes indicar patientId o patientEmail.');
  }

  private async assertCanAccess(
    user: AuthenticatedUser,
    prescription: PrescriptionRecord,
  ): Promise<void> {
    if (user.role === Role.admin) {
      return;
    }

    if (user.role === Role.doctor) {
      const authorId = await this.prescriptionRepository.resolveDoctorIdByUserId(
        user.id,
      );

      if (authorId === prescription.authorId) {
        return;
      }
    }

    if (user.role === Role.patient) {
      const patientId = await this.prescriptionRepository.resolvePatientIdByUserId(
        user.id,
      );

      if (patientId === prescription.patientId) {
        return;
      }
    }

    throw new ForbiddenException('No tienes acceso a esta prescripción.');
  }

  private parseSort(order?: string): {
    sortBy: 'createdAt' | 'consumedAt';
    sortOrder: 'asc' | 'desc';
  } {
    if (!order) {
      return {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
    }

    const [sortBy, sortOrder] = order.split(':');

    if (
      (sortBy !== 'createdAt' && sortBy !== 'consumedAt') ||
      (sortOrder !== 'asc' && sortOrder !== 'desc')
    ) {
      throw new BadRequestException(
        'El parámetro order debe tener el formato createdAt:desc o consumedAt:asc.',
      );
    }

    return {
      sortBy,
      sortOrder,
    };
  }
}
