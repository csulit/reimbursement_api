import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import * as Joi from 'joi';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // validationSchema: Joi.object({
      //   DATABASE_URL: Joi.string().required(),
      // }),
      // envFilePath: ['../../.env'],
    }),
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
