import { Injectable } from '@nestjs/common';
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
  ) {
    this.node_env = this.configService.get('NODE_ENV');
  }

  async login(user: UserEntity, response: Response) {
    const expires = new Date();

    const x = expires.setSeconds(
      expires.getSeconds() +
        Number(this.configService.get('JWT_EXPIRATION_IN_SECONDS')),
    );

    const token = this.jwtService.sign({ user_id: user.id });

    response.cookie('Authentication', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.node_env === 'production' ? true : false,
      expires: new Date(x),
    });
  }

  async getToken(email: string, response: Response) {
    const expires = new Date(Date.now());

    const user = await this.usersService.byEmail(email);

    const x = expires.setSeconds(
      expires.getSeconds() +
        Number(this.configService.get('JWT_EXPIRATION_IN_SECONDS')),
    );

    const token = this.jwtService.sign({
      user_id: user.id,
    });

    response.cookie('Authentication', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.node_env === 'production' ? true : false,
      expires: new Date(x),
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
