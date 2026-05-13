import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  AdminMetricsResponse,
  MetricsFilters,
  MetricsRepository,
} from '../../domain/repositories/metrics.repository';

@Injectable()
export class PrismaMetricsRepository implements MetricsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(filters: MetricsFilters): Promise<AdminMetricsResponse> {
    const prescriptionWhere: Prisma.PrescriptionWhereInput = {
      deletedAt: null,
      ...(filters.from || filters.to
        ? {
            createdAt: {
              gte: filters.from,
              lte: filters.to,
            },
          }
        : {}),
    };

    const [doctors, patients, prescriptions, pending, consumed, byDay, topDoctors] =
      await Promise.all([
        this.prisma.doctor.count({
          where: {
            deletedAt: null,
            user: {
              deletedAt: null,
            },
          },
        }),
        this.prisma.patient.count({
          where: {
            deletedAt: null,
            user: {
              deletedAt: null,
            },
          },
        }),
        this.prisma.prescription.count({
          where: prescriptionWhere,
        }),
        this.prisma.prescription.count({
          where: {
            ...prescriptionWhere,
            status: 'pending',
          },
        }),
        this.prisma.prescription.count({
          where: {
            ...prescriptionWhere,
            status: 'consumed',
          },
        }),
        this.getPrescriptionsByDay(filters),
        this.getTopDoctors(filters),
      ]);

    return {
      totals: {
        doctors,
        patients,
        prescriptions,
      },
      byStatus: {
        pending,
        consumed,
      },
      byDay,
      topDoctors,
    };
  }

  private async getPrescriptionsByDay(
    filters: MetricsFilters,
  ): Promise<Array<{ date: string; count: number }>> {
    const rows = await this.prisma.$queryRaw<Array<{ date: Date; count: number }>>(
      Prisma.sql`
        SELECT DATE(created_at) AS date, COUNT(*)::int AS count
        FROM prescriptions
        WHERE deleted_at IS NULL
        ${filters.from ? Prisma.sql`AND created_at >= ${filters.from}` : Prisma.empty}
        ${filters.to ? Prisma.sql`AND created_at <= ${filters.to}` : Prisma.empty}
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `,
    );

    return rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      count: row.count,
    }));
  }

  private async getTopDoctors(
    filters: MetricsFilters,
  ): Promise<Array<{ doctorId: string; doctorName: string; count: number }>> {
    const grouped = await this.prisma.prescription.groupBy({
      by: ['authorId'],
      where: {
        deletedAt: null,
        ...(filters.from || filters.to
          ? {
              createdAt: {
                gte: filters.from,
                lte: filters.to,
              },
            }
          : {}),
      },
      _count: {
        authorId: true,
      },
      orderBy: {
        _count: {
          authorId: 'desc',
        },
      },
      take: 5,
    });

    const doctors = await this.prisma.doctor.findMany({
      where: {
        id: {
          in: grouped.map((item) => item.authorId),
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const doctorNameById = new Map(
      doctors.map((doctor) => [doctor.id, doctor.user.name]),
    );

    return grouped.map((item) => ({
      doctorId: item.authorId,
      doctorName: doctorNameById.get(item.authorId) ?? 'Desconocido',
      count: item._count.authorId,
    }));
  }
}
