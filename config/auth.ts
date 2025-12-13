import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET || 'your_super_secret_key_change_me',
  signOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d', // e.g., '1d', '2h', '30m'
  },
};

export const passwordHashingConfig = {
  saltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS || '10', 10), // Number of salt rounds for bcrypt
};