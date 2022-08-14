import { PrismaModule, RabbitMqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { REIMBURSEMENT_QUEUE_SERVICE } from 'apps/reimbursements/src/constant';
import { UsersService } from './users.service';

@Module({
  imports: [
    PrismaModule,
    RabbitMqModule.register({
      name: REIMBURSEMENT_QUEUE_SERVICE,
    }),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
