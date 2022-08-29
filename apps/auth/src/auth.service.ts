import { PrismaService } from '@app/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import UserEntity from './users/entity/user.entity';
import { UsersService } from './users/users.service';

@Injectable()
export class AuthService {
  private node_env: 'development' | 'production' | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {
    this.node_env = this.configService.get('NODE_ENV');
  }

  async login(user: UserEntity, response: Response) {
    const expires = new Date();

    expires.setSeconds(
      expires.getSeconds() +
        this.configService.get('JWT_EXPIRATION_IN_SECONDS'),
    );

    const token = this.jwtService.sign({ user_id: user.id });

    response.cookie('Authentication', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.node_env === 'production' ? true : false,
      expires,
    });
  }

  async getToken(email: string, api_key: string, response: Response) {
    if (!api_key) {
      throw new UnauthorizedException('API key not found!');
    }

    const key = await this.prisma.apikey.findUnique({
      where: { key: api_key },
    });

    if (!key) {
      throw new UnauthorizedException('Invalid API key!');
    }

    if (key.revoked) {
      throw new UnauthorizedException('API key has been revoked!');
    }

    const expires = new Date(Date.now());

    const user = await this.usersService.byEmail(email);

    expires.setSeconds(
      expires.getSeconds() +
        this.configService.get('JWT_EXPIRATION_IN_SECONDS'),
    );

    const token = this.jwtService.sign({
      user_id: user.id,
    });

    response.cookie('Authentication', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.node_env === 'production' ? true : false,
      expires,
    });

    return {
      user,
      token,
      expires,
    };
  }

  logout(response: Response) {
    response.clearCookie('Authentication');
  }
}
