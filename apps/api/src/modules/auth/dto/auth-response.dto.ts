import { Role } from '@prisma/client';

export class AuthTokensResponseDto {
  accessToken: string;
  refreshToken: string;
}

export class ProfileResponseDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  doctorId: string | null;
  patientId: string | null;
  createdAt: Date;
}
