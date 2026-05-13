import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import {
  REFRESH_TOKEN_REPOSITORY,
  USER_REPOSITORY,
} from '../../../common/tokens/injection.tokens';
import type { RefreshTokenRepository } from '../domain/repositories/refresh-token.repository';
import type { UserRepository } from '../domain/repositories/user.repository';
import {
  AuthTokensResponseDto,
  ProfileResponseDto,
} from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokenService, TokenSessionContext } from './token.service';

const PASSWORD_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async register(
    registerDto: RegisterDto,
    context: TokenSessionContext = {},
  ): Promise<AuthTokensResponseDto> {
    if (registerDto.role === Role.admin) {
      throw new ConflictException(
        'El rol admin no puede registrarse desde este endpoint.',
      );
    }

    const existingUser = await this.userRepository.findActiveByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      PASSWORD_ROUNDS,
    );

    const user = await this.userRepository.createUser({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      role: registerDto.role,
      specialty: registerDto.specialty,
      licenseNumber: registerDto.licenseNumber,
      birthDate: registerDto.birthDate,
    });

    return this.tokenService.issueTokens(
      this.tokenService.buildPayload(user),
      context,
    );
  }

  async login(
    loginDto: LoginDto,
    context: TokenSessionContext = {},
  ): Promise<AuthTokensResponseDto> {
    const user = await this.userRepository.findActiveByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    await this.refreshTokenRepository.revokeAllByUserId(user.id);

    return this.tokenService.issueTokens(
      this.tokenService.buildPayload(user),
      context,
    );
  }

  async refresh(
    refreshToken: string,
    context: TokenSessionContext = {},
  ): Promise<AuthTokensResponseDto> {
    return this.tokenService.rotateRefreshToken(refreshToken, context);
  }

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findActiveById(userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      doctorId: user.doctor?.id ?? null,
      patientId: user.patient?.id ?? null,
      createdAt: user.createdAt,
    };
  }
}
