import {
  AuthModule,
  DoSpacesModule,
  PrismaModule,
  RabbitMqModule,
} from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from 'apps/auth/src/users/users.module';
import { RMQ_REIMBURSEMENT_QUEUE_SERVICE } from './constant';
import { ReimbursementsController } from './reimbursements.controller';
import { ApproversService } from './services/approvers.service';
import { ParticularsService } from './services/particulars.service';
import { ReimbursementsService } from './services/reimbursements.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    RabbitMqModule.register({
      name: RMQ_REIMBURSEMENT_QUEUE_SERVICE,
    }),
    AuthModule,

    // Remove soon.
    UsersModule,

    DoSpacesModule,
    PrismaModule,
  ],
  controllers: [ReimbursementsController],
  providers: [ReimbursementsService, ParticularsService, ApproversService],
})
export class ReimbursementsModule {}
