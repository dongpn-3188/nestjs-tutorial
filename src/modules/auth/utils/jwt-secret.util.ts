import { ConfigService } from '@nestjs/config';
import { JwtSecretMissingError } from '../errors/jwt-secret-missing.error';

export const resolveJwtSecret = (configService: ConfigService): string => {
  const secret = configService.get<string>('JWT_SECRET');
  if (!secret) {
    throw new JwtSecretMissingError();
  }

  return secret;
};