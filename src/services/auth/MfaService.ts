```typescript
import { authenticator } from 'otplib';
import { toFileStream } from 'qrcode';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/UserService';
import { PrismaService } from '../../prisma/PrismaService';
import { User } from '@prisma/client';

@Injectable()
export class MfaService {
  @Inject(ConfigService)
  private readonly configService: ConfigService;
  @Inject(UserService)
  private readonly userService: UserService;
  @Inject(PrismaService)
  private readonly prismaService: PrismaService;

  async generateMfaSecret(user: User) {
    const secret = authenticator.generateSecret();

    const appName = this.configService.get('APP_NAME') || 'MyApp';

    const otpauthUrl = authenticator.keyuri(
      user.email,
      appName,
      secret,
    );

    await this.userService.setMfaSecret(secret, user.id);

    return {
      secret,
      otpauthUrl,
    };
  }

  async generateQrCodeStream(otpauthUrl: string) {
    return toFileStream(
      './qr.png',
      otpauthUrl,
    );
  }

  async isMfaEnabled(userId: string): Promise<boolean> {
    const user = await this.userService.getUserById(userId);
    return user.isMfaEnabled;
  }


  async verifyMfa(otp: string, user: User) {
    const secret = user.mfaSecret;
    return authenticator.verify({
      token: otp,
      secret,
    });
  }

  async enableMfa(userId: string) {
    await this.userService.enableMfa(userId);
  }

  async disableMfa(userId: string) {
    await this.userService.disableMfa(userId);
  }
}
```