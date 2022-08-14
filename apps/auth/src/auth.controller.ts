import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorator/current-user.decorator';
import { EmailQueryDTO } from './dto/email.query.dto';
import JwtAuthGuard from './guards/jwt.guard';
import { LocalGuard } from './guards/local.guard';
import UserEntity from './users/entity/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalGuard)
  async login(
    @CurrentUser() user: UserEntity,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.login(user, response);

    response.send(user);
  }

  @Get('get-token')
  generateJwt(
    @Query() query: EmailQueryDTO,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.getToken(query.email, response);
  }

  @MessagePattern('validate_user')
  @UseGuards(JwtAuthGuard)
  async validateUser(@CurrentUser() user: UserEntity) {
    return user;
  }
}
