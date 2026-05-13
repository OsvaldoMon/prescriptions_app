export interface RefreshTokenRecord {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
}

export interface CreateRefreshTokenInput {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface RefreshTokenRepository {
  findActiveByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  createToken(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord>;
  revokeToken(id: string, replacedById?: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
}
