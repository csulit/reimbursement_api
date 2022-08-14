import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import UserEntity from './users/entity/user.entity';
import { UsersService } from './users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

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
      secure: false,
      expires,
    });
  }

  async getToken(email: string, response: Response) {
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
      secure: false,
      expires,
    });

    return { user, token };
  }

  logout(response: Response) {
    response.clearCookie('Authentication');
  }
}
