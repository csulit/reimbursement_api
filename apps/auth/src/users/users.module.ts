import { PrismaModule, RabbitMqModule } from '@app/common';
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  imports: [
    PrismaModule,
    RabbitMqModule.register({
      name: 'REIMBURSEMENT',
    }),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
