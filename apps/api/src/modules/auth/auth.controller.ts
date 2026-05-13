import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuthService } from './application/auth.service';
import {
  AuthTokensResponseDto,
  ProfileResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(
    @Body() registerDto: RegisterDto,
    @Req() request: Request,
  ): Promise<AuthTokensResponseDto> {
    return this.authService.register(registerDto, this.buildSessionContext(request));
  }

  @Public()
  @Post('login')
  login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
  ): Promise<AuthTokensResponseDto> {
    return this.authService.login(loginDto, this.buildSessionContext(request));
  }

  @Public()
  @Post('refresh')
  refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() request: Request,
  ): Promise<AuthTokensResponseDto> {
    return this.authService.refresh(
      refreshTokenDto.refreshToken,
      this.buildSessionContext(request),
    );
  }

  @ApiBearerAuth('access-token')
  @Get('profile')
  getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProfileResponseDto> {
    return this.authService.getProfile(user.id);
  }

  private buildSessionContext(request: Request) {
    const forwardedFor = request.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim() ?? request.ip;

    return {
      userAgent: request.headers['user-agent'],
      ipAddress,
    };
  }
}
