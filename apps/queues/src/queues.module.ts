import { Module } from '@nestjs/common';
import { QueuesController } from './queues.controller';
import { QueuesService } from './queues.service';

@Module({
  imports: [],
  controllers: [QueuesController],
  providers: [QueuesService],
})
export class QueuesModule {}
