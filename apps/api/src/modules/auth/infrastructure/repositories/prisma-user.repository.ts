import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  AuthUserRecord,
  CreateUserInput,
  UserRepository,
} from '../../domain/repositories/user.repository';

const authUserSelect = {
  id: true,
  email: true,
  password: true,
  name: true,
  role: true,
  createdAt: true,
  doctor: {
    select: {
      id: true,
    },
  },
  patient: {
    select: {
      id: true,
    },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: authUserSelect,
    });
  }

  findActiveById(id: string): Promise<AuthUserRecord | null> {
    return this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: authUserSelect,
    });
  }

  async createUser(input: CreateUserInput): Promise<AuthUserRecord> {
    return this.prisma.user.create({
      data: {
        email: input.email,
        password: input.password,
        name: input.name,
        role: input.role,
        doctor:
          input.role === Role.doctor
            ? {
                create: {
                  specialty: input.specialty,
                  licenseNumber: input.licenseNumber,
                },
              }
            : undefined,
        patient:
          input.role === Role.patient
            ? {
                create: {
                  birthDate: input.birthDate,
                },
              }
            : undefined,
      },
      select: authUserSelect,
    });
  }
}
