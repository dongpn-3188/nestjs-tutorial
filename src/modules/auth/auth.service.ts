import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const emailInUse = await this.authRepository.existsByEmail(registerDto.email);

    if (emailInUse) {
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      this.saltRounds,
    );

    const savedUser = await this.authRepository.createUser(registerDto, hashedPassword);
    const payload = { sub: savedUser.id, email: savedUser.email };

    return {
      accessToken: await this.jwtService.signAsync(payload, { expiresIn: '1h' })
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.authRepository.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email };

    return {
      accessToken: await this.jwtService.signAsync(payload, { expiresIn: '1h' }),
    };
  }
}
