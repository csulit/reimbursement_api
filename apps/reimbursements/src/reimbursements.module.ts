import {
  AuthModule,
  DoSpacesModule,
  PrismaModule,
  RabbitMqModule,
} from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
//import * as Joi from 'joi';
import { ReimbursementsController } from './reimbursements.controller';
import { ReimbursementsService } from './reimbursements.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // validationSchema: Joi.object({
      //   REIMBURSEMENT_PORT: Joi.number().required(),
      // }),
      envFilePath: ['../reimbursements.dev.env', '../reimbursements.prod.env'],
    }),
    RabbitMqModule.register({
      name: 'REIMBURSEMENT',
    }),
    AuthModule,
    DoSpacesModule,
    PrismaModule,
  ],
  controllers: [ReimbursementsController],
  providers: [ReimbursementsService],
})
export class ReimbursementsModule {}
