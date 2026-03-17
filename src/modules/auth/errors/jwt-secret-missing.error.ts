export class JwtSecretMissingError extends Error {
  constructor() {
    super('JWT_SECRET must be set in the environment');
    this.name = 'JwtSecretMissingError';
  }
}