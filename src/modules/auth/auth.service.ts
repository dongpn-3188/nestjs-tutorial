import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthRepository } from './auth.repository';
import { SharedService } from '../../common/shared.service';
import { SALT_ROUNDS } from '../../common/constants';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly sharedService: SharedService,
    private readonly mailService: MailService,
    private readonly logger: Logger,
  ) {}

  async checkEmailExistsOrThrow(email: string): Promise<void> {
    const emailExist = await this.authRepository.existsByEmail(email);
    if (emailExist) {
      throw new BadRequestException(
        this.sharedService.getSharedMessage('message.EMAIL_ALREADY_EXISTS'),
      );
    }
  }

  async register(registerDto: RegisterDto) {
    await this.checkEmailExistsOrThrow(registerDto.email);
    let savedUser;

    try {
      const hashedPassword = await bcrypt.hash(
        registerDto.password,
        SALT_ROUNDS,
      );
      savedUser = await this.authRepository.createUser(registerDto, hashedPassword);
    } catch {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage('message.REGISTRATION_FAILED'),
      });
    }

    const payload = { sub: savedUser.id, email: savedUser.email };

    try {
    await this.mailService.sendWelcomeEmail({ email: savedUser.email, name: savedUser.username });
    } catch (error) {
      this.logger.error(
        'Failed to send welcome email',
        {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          processName: 'welcome',
        },
      );
    }

    return {
      accessToken: await this.jwtService.signAsync(payload, { expiresIn: '1h' }),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.authRepository.findByEmail(loginDto.email);

    if (!user) {
      throw new BadRequestException(
        this.sharedService.getSharedMessage('message.INVALID_EMAIL_OR_PASSWORD'),
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException(
        this.sharedService.getSharedMessage('message.INVALID_EMAIL_OR_PASSWORD'),
      );
    }

    const payload = { sub: user.id, email: user.email };

    return {
      accessToken: await this.jwtService.signAsync(payload, { expiresIn: '1h' }),
    };
  }
}
