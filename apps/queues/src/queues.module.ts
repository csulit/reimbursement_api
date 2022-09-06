import { PrismaModule, RabbitMqModule } from '@app/common';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueuesController } from './queues.controller';
import { ErpQueuesService } from './services/erp.queues.service';
import { LoggerQueuesService } from './services/logger.queues.service';
import { ReimbursementsQueuesService } from './services/reimbursements.queues.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
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
