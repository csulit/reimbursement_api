import { PrismaModule } from '@app/common';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { QueuesController } from './queues.controller';
import { ErpQueuesService } from './services/erp.queues.service';
import { LoggerQueuesService } from './services/logger.queues.service';
import { ReimbursementsQueuesService } from './services/reimbursements.queues.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({}),
      envFilePath: ['../queues.dev.env', '../queues.prod.env'],
    }),
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
