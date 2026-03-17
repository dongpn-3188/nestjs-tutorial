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

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly sharedService: SharedService,
  ) {}

  async register(registerDto: RegisterDto) {
    const emailInUse = await this.authRepository.existsByEmail(registerDto.email);

    if (emailInUse) {
      throw new BadRequestException(
        this.sharedService.getSharedMessage('message.EMAIL_ALREADY_EXISTS'),
      );
    }

    try {
      const hashedPassword = await bcrypt.hash(
        registerDto.password,
        SALT_ROUNDS,
      );
      const savedUser = await this.authRepository.createUser(registerDto, hashedPassword);
      const payload = { sub: savedUser.id, email: savedUser.email };

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
