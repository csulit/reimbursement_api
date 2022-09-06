import {
  Body,
  Controller,
  Get,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorator/current-user.decorator';
import { CreateUserDTO } from './dto/create-user.dto';
import { EmailQueryDTO } from './dto/email.query.dto';
import JwtAuthGuard from './guards/jwt.guard';
import { LocalGuard } from './guards/local.guard';
import UserEntity from './users/entity/user.entity';
import { UsersService } from './users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post('login')
  @UseGuards(LocalGuard)
  async login(
    @CurrentUser() user: UserEntity,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.login(user, response);

    response.send(user);
  }

  @Post('register')
  async register(@Body() data: CreateUserDTO) {
    return this.userService.create(data);
  }

  // No body payload because data will be gather in erp
  @UseGuards(JwtAuthGuard)
  @Patch('user/:id')
  updateUser(
    @Req() request: Request,
    @Query('id', new ParseUUIDPipe()) id: string,
  ) {
    console.log(request.headers);

    return this.userService.updateUser(id);
  }

  @Get('get-token')
  generateJwt(
    @Query() query: EmailQueryDTO,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log(request.headers);

    return this.authService.getToken(query.email, response);
  }

  @MessagePattern('validate_user')
  @UseGuards(JwtAuthGuard)
  async validateUser(@CurrentUser() user: UserEntity) {
    return user;
  }
}
