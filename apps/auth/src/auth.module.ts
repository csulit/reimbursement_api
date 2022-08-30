import { PrismaModule, RabbitMqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as Joi from 'joi';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['./apps/auth/auth.dev.env', './apps/auth/auth.prod.env'],
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        AUTH_PORT: Joi.string().required(),
        JWT_SECRET_KEY: Joi.string().required(),
        JWT_EXPIRATION_IN_SECONDS: Joi.string().required(),
        JWT_EXPIRATION_IN_DAYS: Joi.string().required(),
        RABBIT_MQ_URI: Joi.string().required(),
      }),
    }),
    RabbitMqModule,
    PrismaModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET_KEY'),
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRATION_IN_DAYS'),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
