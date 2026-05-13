import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import type { StringValue } from 'ms';
import ms from 'ms';
import { hashToken } from '../../../common/utils/hash.util';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { REFRESH_TOKEN_REPOSITORY } from '../../../common/tokens/injection.tokens';
import type { RefreshTokenRepository } from '../domain/repositories/refresh-token.repository';

export interface TokenSessionContext {
  userAgent?: string;
  ipAddress?: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async issueTokens(
    payload: JwtPayload,
    context: TokenSessionContext = {},
  ): Promise<IssuedTokens> {
    const accessToken = this.createAccessToken(payload);
    const refreshToken = this.createRefreshToken(payload);
    const refreshExpiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
      '7d',
    );
    const refreshTtl = ms(refreshExpiresIn as StringValue);

    if (typeof refreshTtl !== 'number') {
      throw new Error('JWT_REFRESH_EXPIRES_IN tiene un formato inválido.');
    }

    await this.refreshTokenRepository.createToken({
      tokenHash: hashToken(refreshToken),
      userId: payload.sub,
      expiresAt: new Date(Date.now() + refreshTtl),
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async rotateRefreshToken(
    refreshToken: string,
    context: TokenSessionContext = {},
  ): Promise<IssuedTokens> {
    const payload = this.verifyRefreshToken(refreshToken);
    const storedToken = await this.refreshTokenRepository.findActiveByHash(
      hashToken(refreshToken),
    );

    if (!storedToken || storedToken.userId !== payload.sub) {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }

    const nextPayload: JwtPayload = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    const accessToken = this.createAccessToken(nextPayload);
    const nextRefreshToken = this.createRefreshToken(nextPayload);
    const refreshExpiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
      '7d',
    );
    const refreshTtl = ms(refreshExpiresIn as StringValue);

    if (typeof refreshTtl !== 'number') {
      throw new Error('JWT_REFRESH_EXPIRES_IN tiene un formato inválido.');
    }

    const replacement = await this.refreshTokenRepository.createToken({
      tokenHash: hashToken(nextRefreshToken),
      userId: payload.sub,
      expiresAt: new Date(Date.now() + refreshTtl),
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    });

    await this.refreshTokenRepository.revokeToken(
      storedToken.id,
      replacement.id,
    );

    return {
      accessToken,
      refreshToken: nextRefreshToken,
    };
  }

  createAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  createRefreshToken(payload: JwtPayload): string {
    const refreshSecret = this.configService.getOrThrow<string>(
      'jwt.refreshSecret',
    );
    const refreshExpiresIn = this.configService.get<string>(
      'jwt.refreshExpiresIn',
      '7d',
    );

    return this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as StringValue,
    });
  }

  verifyRefreshToken(refreshToken: string): JwtPayload {
    try {
      const refreshSecret = this.configService.getOrThrow<string>(
        'jwt.refreshSecret',
      );

      return this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }
  }

  buildPayload(user: {
    id: string;
    email: string;
    role: Role;
  }): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
