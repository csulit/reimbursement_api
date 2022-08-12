import { Controller, Get } from '@nestjs/common';
import { QueuesService } from './queues.service';

@Controller()
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Get()
  getHello(): string {
    return this.queuesService.getHello();
  }
}
