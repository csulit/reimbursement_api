import { PrismaModule, RabbitMqModule } from '@app/common';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import * as Joi from 'joi';
import { QueuesController } from './queues.controller';
import { ErpQueuesService } from './services/erp.queues.service';
import { LoggerQueuesService } from './services/logger.queues.service';
import { ReimbursementsQueuesService } from './services/reimbursements.queues.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: ['./apps/queues/queues.dev.env'],
      // validationSchema: Joi.object({
      //   DATABASE_URL: Joi.string().required(),
      //   ERP_API_KEY: Joi.string().required(),
      //   ERP_HR_BASE_API_URL: Joi.string().required(),
      //   ERP_AUTH_BASE_API_URL: Joi.string().required(),
      //   RABBIT_MQ_URI: Joi.string().required(),
      // }),
    }),
    RabbitMqModule,
    PrismaModule,
    HttpModule,
  ],
  controllers: [QueuesController],
  providers: [
    ReimbursementsQueuesService,
    LoggerQueuesService,
    ErpQueuesService,
  ],
})
export class QueuesModule {}
