import { Injectable } from '@nestjs/common';
import { PrescriptionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  CreatePrescriptionInput,
  PaginatedPrescriptions,
  PrescriptionListFilters,
  PrescriptionRecord,
  PrescriptionRepository,
} from '../../domain/repositories/prescription.repository';

const prescriptionInclude = {
  items: {
    orderBy: {
      sortOrder: 'asc',
    },
  },
  patient: {
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  },
  author: {
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  },
} satisfies Prisma.PrescriptionInclude;

type PrescriptionWithRelations = Prisma.PrescriptionGetPayload<{
  include: typeof prescriptionInclude;
}>;

@Injectable()
export class PrismaPrescriptionRepository implements PrescriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreatePrescriptionInput): Promise<PrescriptionRecord> {
    const prescription = await this.prisma.prescription.create({
      data: {
        code: input.code,
        notes: input.notes,
        patientId: input.patientId,
        authorId: input.authorId,
        items: {
          create: input.items.map((item, index) => ({
            name: item.name,
            dosage: item.dosage,
            quantity: item.quantity,
            instructions: item.instructions,
            sortOrder: index,
          })),
        },
      },
      include: prescriptionInclude,
    });

    return this.mapPrescription(prescription);
  }

  async findById(id: string): Promise<PrescriptionRecord | null> {
    const prescription = await this.prisma.prescription.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: prescriptionInclude,
    });

    return prescription ? this.mapPrescription(prescription) : null;
  }

  async findMany(
    filters: PrescriptionListFilters,
  ): Promise<PaginatedPrescriptions> {
    const where = this.buildWhereClause(filters);
    const orderBy = {
      [filters.sortBy]: filters.sortOrder,
    } as Prisma.PrescriptionOrderByWithRelationInput;

    const [total, prescriptions] = await this.prisma.$transaction([
      this.prisma.prescription.count({ where }),
      this.prisma.prescription.findMany({
        where,
        include: prescriptionInclude,
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
    ]);

    return {
      data: prescriptions.map((prescription) =>
        this.mapPrescription(prescription),
      ),
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / filters.limit)),
      },
    };
  }

  async markAsConsumed(
    id: string,
    consumedAt: Date,
  ): Promise<PrescriptionRecord> {
    const prescription = await this.prisma.prescription.update({
      where: { id },
      data: {
        status: PrescriptionStatus.consumed,
        consumedAt,
      },
      include: prescriptionInclude,
    });

    return this.mapPrescription(prescription);
  }

  codeExists(code: string): Promise<boolean> {
    return this.prisma.prescription
      .count({
        where: { code },
      })
      .then((count) => count > 0);
  }

  async resolveDoctorIdByUserId(userId: string): Promise<string | null> {
    const doctor = await this.prisma.doctor.findFirst({
      where: {
        userId,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
      },
    });

    return doctor?.id ?? null;
  }

  async resolvePatientIdByUserId(userId: string): Promise<string | null> {
    const patient = await this.prisma.patient.findFirst({
      where: {
        userId,
        deletedAt: null,
        user: {
          deletedAt: null,
        },
      },
      select: {
        id: true,
      },
    });

    return patient?.id ?? null;
  }

  async resolvePatientIdByEmail(email: string): Promise<string | null> {
    const patient = await this.prisma.patient.findFirst({
      where: {
        deletedAt: null,
        user: {
          email,
          deletedAt: null,
          role: 'patient',
        },
      },
      select: {
        id: true,
      },
    });

    return patient?.id ?? null;
  }

  private buildWhereClause(
    filters: PrescriptionListFilters,
  ): Prisma.PrescriptionWhereInput {
    const createdAtFilter =
      filters.from || filters.to
        ? {
            createdAt: {
              gte: filters.from,
              lte: filters.to,
            },
          }
        : undefined;

    const searchFilter = filters.search
      ? {
          OR: [
            {
              notes: {
                contains: filters.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              code: {
                contains: filters.search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              items: {
                some: {
                  name: {
                    contains: filters.search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            },
          ],
        }
      : undefined;

    return {
      deletedAt: null,
      status: filters.status,
      patientId: filters.patientId,
      authorId: filters.authorId ?? filters.doctorId,
      ...createdAtFilter,
      ...searchFilter,
    };
  }

  private mapPrescription(
    prescription: PrescriptionWithRelations,
  ): PrescriptionRecord {
    return {
      id: prescription.id,
      code: prescription.code,
      status: prescription.status,
      notes: prescription.notes,
      createdAt: prescription.createdAt,
      updatedAt: prescription.updatedAt,
      consumedAt: prescription.consumedAt,
      patientId: prescription.patientId,
      authorId: prescription.authorId,
      patient: {
        id: prescription.patientId,
        name: prescription.patient.user.name,
        email: prescription.patient.user.email,
      },
      author: {
        id: prescription.authorId,
        name: prescription.author.user.name,
        email: prescription.author.user.email,
        specialty: prescription.author.specialty,
        licenseNumber: prescription.author.licenseNumber,
      },
      items: prescription.items.map((item) => ({
        id: item.id,
        name: item.name,
        dosage: item.dosage,
        quantity: item.quantity,
        instructions: item.instructions,
        sortOrder: item.sortOrder,
      })),
    };
  }
}
