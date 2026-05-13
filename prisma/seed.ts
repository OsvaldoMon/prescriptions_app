import {
  AuditAction,
  PrismaClient,
  PrescriptionStatus,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD_ROUNDS = 10;

type SeedUser = {
  email: string;
  password: string;
  name: string;
  role: Role;
};

type SeedPrescription = {
  code: string;
  status: PrescriptionStatus;
  notes?: string;
  consumedAt?: Date;
  items: Array<{
    name: string;
    dosage?: string;
    quantity?: number;
    instructions?: string;
  }>;
};

const seedUsers: SeedUser[] = [
  {
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Administrador General',
    role: Role.admin,
  },
  {
    email: 'dr@test.com',
    password: 'dr123',
    name: 'Dra. Ana Méndez',
    role: Role.doctor,
  },
  {
    email: 'patient@test.com',
    password: 'patient123',
    name: 'Carlos Rivera',
    role: Role.patient,
  },
];

const prescriptionSeeds: SeedPrescription[] = [
  {
    code: 'RX-2025-0001',
    status: PrescriptionStatus.pending,
    notes: 'Control en 7 días si persisten síntomas.',
    items: [
      {
        name: 'Amoxicilina 500mg',
        dosage: '1 cápsula cada 8 horas',
        quantity: 15,
        instructions: 'Tomar después de comer.',
      },
      {
        name: 'Paracetamol 500mg',
        dosage: '1 tableta cada 6 horas',
        quantity: 10,
        instructions: 'Solo si hay fiebre o dolor.',
      },
    ],
  },
  {
    code: 'RX-2025-0002',
    status: PrescriptionStatus.consumed,
    notes: 'Reposo relativo y abundante hidratación.',
    consumedAt: new Date('2025-10-20T15:30:00.000Z'),
    items: [
      {
        name: 'Ibuprofeno 400mg',
        dosage: '1 tableta cada 8 horas',
        quantity: 12,
        instructions: 'Tomar con alimentos.',
      },
    ],
  },
  {
    code: 'RX-2025-0003',
    status: PrescriptionStatus.pending,
    notes: 'Evitar exposición solar directa.',
    items: [
      {
        name: 'Loratadina 10mg',
        dosage: '1 tableta al día',
        quantity: 7,
        instructions: 'Preferiblemente por la noche.',
      },
    ],
  },
  {
    code: 'RX-2025-0004',
    status: PrescriptionStatus.consumed,
    notes: 'Completar el tratamiento aunque mejoren los síntomas.',
    consumedAt: new Date('2025-10-22T11:00:00.000Z'),
    items: [
      {
        name: 'Azitromicina 500mg',
        dosage: '1 tableta al día',
        quantity: 3,
        instructions: 'Tomar 1 hora antes de las comidas.',
      },
      {
        name: 'Suero oral',
        dosage: '200 ml después de cada evacuación',
        quantity: 6,
        instructions: 'Mantener refrigerado tras abrir.',
      },
    ],
  },
  {
    code: 'RX-2025-0005',
    status: PrescriptionStatus.pending,
    items: [
      {
        name: 'Omeprazol 20mg',
        dosage: '1 cápsula cada 24 horas',
        quantity: 14,
        instructions: 'En ayunas, 30 minutos antes del desayuno.',
      },
    ],
  },
  {
    code: 'RX-2025-0006',
    status: PrescriptionStatus.consumed,
    consumedAt: new Date('2025-10-25T09:15:00.000Z'),
    items: [
      {
        name: 'Salbutamol inhalador',
        dosage: '2 inhalaciones cada 6 horas',
        quantity: 1,
        instructions: 'Agitar antes de usar.',
      },
    ],
  },
  {
    code: 'RX-2025-0007',
    status: PrescriptionStatus.pending,
    notes: 'Seguimiento ambulatorio en 10 días.',
    items: [
      {
        name: 'Metformina 850mg',
        dosage: '1 tableta cada 12 horas',
        quantity: 60,
        instructions: 'Tomar con las comidas principales.',
      },
    ],
  },
  {
    code: 'RX-2025-0008',
    status: PrescriptionStatus.consumed,
    consumedAt: new Date('2025-10-28T18:45:00.000Z'),
    items: [
      {
        name: 'Diclofenaco gel 1%',
        dosage: 'Aplicar 3 veces al día',
        quantity: 1,
        instructions: 'Solo en zona afectada, sin masajear fuerte.',
      },
    ],
  },
];

async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, PASSWORD_ROUNDS);
}

async function clearDatabase(): Promise<void> {
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsersAndProfiles(): Promise<{
  doctorId: string;
  patientId: string;
  adminUserId: string;
}> {
  const createdUsers = await Promise.all(
    seedUsers.map(async (user) => {
      const password = await hashPassword(user.password);

      return prisma.user.create({
        data: {
          email: user.email,
          password,
          name: user.name,
          role: user.role,
        },
      });
    }),
  );

  const admin = createdUsers.find((user) => user.role === Role.admin);
  const doctorUser = createdUsers.find((user) => user.role === Role.doctor);
  const patientUser = createdUsers.find((user) => user.role === Role.patient);

  if (!admin || !doctorUser || !patientUser) {
    throw new Error('No se pudieron crear los usuarios base del seed.');
  }

  const doctor = await prisma.doctor.create({
    data: {
      userId: doctorUser.id,
      specialty: 'Medicina General',
      licenseNumber: 'MED-AR-45821',
    },
  });

  const patient = await prisma.patient.create({
    data: {
      userId: patientUser.id,
      birthDate: new Date('1990-05-14T00:00:00.000Z'),
    },
  });

  return {
    doctorId: doctor.id,
    patientId: patient.id,
    adminUserId: admin.id,
  };
}

async function seedPrescriptions(
  doctorId: string,
  patientId: string,
  adminUserId: string,
): Promise<void> {
  for (const [index, prescription] of prescriptionSeeds.entries()) {
    const createdPrescription = await prisma.prescription.create({
      data: {
        code: prescription.code,
        status: prescription.status,
        notes: prescription.notes,
        consumedAt: prescription.consumedAt,
        patientId,
        authorId: doctorId,
        items: {
          create: prescription.items.map((item, itemIndex) => ({
            name: item.name,
            dosage: item.dosage,
            quantity: item.quantity,
            instructions: item.instructions,
            sortOrder: itemIndex,
          })),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'Prescription',
        entityId: createdPrescription.id,
        action: AuditAction.created,
        actorId: adminUserId,
        metadata: {
          code: createdPrescription.code,
          source: 'seed',
          batchIndex: index + 1,
        },
      },
    });

    if (createdPrescription.status === PrescriptionStatus.consumed) {
      await prisma.auditLog.create({
        data: {
          entityType: 'Prescription',
          entityId: createdPrescription.id,
          action: AuditAction.consumed,
          actorId: adminUserId,
          metadata: {
            code: createdPrescription.code,
            consumedAt: createdPrescription.consumedAt,
            source: 'seed',
          },
        },
      });
    }
  }
}

async function main(): Promise<void> {
  await clearDatabase();

  const { doctorId, patientId, adminUserId } = await seedUsersAndProfiles();
  await seedPrescriptions(doctorId, patientId, adminUserId);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
