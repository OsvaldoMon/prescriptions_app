import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserRepository } from '../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../domain/repositories/refresh-token.repository';
import { TokenService } from './token.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let refreshTokenRepository: jest.Mocked<RefreshTokenRepository>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    userRepository = {
      findActiveByEmail: jest.fn(),
      findActiveById: jest.fn(),
      createUser: jest.fn(),
    };
    refreshTokenRepository = {
      findActiveByHash: jest.fn(),
      createToken: jest.fn(),
      revokeToken: jest.fn(),
      revokeAllByUserId: jest.fn(),
    };
    tokenService = {
      issueTokens: jest.fn(),
      rotateRefreshToken: jest.fn(),
      buildPayload: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    authService = new AuthService(
      userRepository,
      refreshTokenRepository,
      tokenService,
    );
  });

  it('rechaza login con credenciales inválidas', async () => {
    userRepository.findActiveByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'missing@test.com', password: 'secret123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza registro de admin', async () => {
    await expect(
      authService.register({
        email: 'admin@test.com',
        password: 'admin123',
        name: 'Admin',
        role: Role.admin,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('emite tokens al iniciar sesión con credenciales válidas', async () => {
    userRepository.findActiveByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'dr@test.com',
      password: 'hashed-password',
      name: 'Doctor',
      role: Role.doctor,
      createdAt: new Date(),
      doctor: { id: 'doctor-1' },
      patient: null,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    tokenService.buildPayload.mockReturnValue({
      sub: 'user-1',
      email: 'dr@test.com',
      role: Role.doctor,
    });
    tokenService.issueTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const result = await authService.login({
      email: 'dr@test.com',
      password: 'dr123',
    });

    expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith(
      'user-1',
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
});
