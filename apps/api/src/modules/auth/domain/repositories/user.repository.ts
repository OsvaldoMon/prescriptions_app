import { Role } from '@prisma/client';

export interface AuthUserRecord {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  createdAt: Date;
  doctor: { id: string } | null;
  patient: { id: string } | null;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: Role;
  specialty?: string;
  licenseNumber?: string;
  birthDate?: Date;
}

export interface UserRepository {
  findActiveByEmail(email: string): Promise<AuthUserRecord | null>;
  findActiveById(id: string): Promise<AuthUserRecord | null>;
  createUser(input: CreateUserInput): Promise<AuthUserRecord>;
}
