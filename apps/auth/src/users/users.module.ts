import { PrismaModule } from '@app/common';
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
