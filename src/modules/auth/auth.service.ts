import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
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

    try {
      const hashedPassword = await bcrypt.hash(
        registerDto.password,
        SALT_ROUNDS,
      );
      const savedUser = await this.authRepository.createUser(registerDto, hashedPassword);
      const payload = { sub: savedUser.id, email: savedUser.email };

      await this.mailService.sendWelcomeEmail({ email: savedUser.email, name: savedUser.username });

      return {
        accessToken: await this.jwtService.signAsync(payload, { expiresIn: '1h' }),
      };
    } catch {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: 'Internal Server Error',
        message: this.sharedService.getSharedMessage('message.REGISTRATION_FAILED'),
      });
    }
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
