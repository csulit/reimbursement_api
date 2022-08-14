import { Controller, Get } from '@nestjs/common';
import { ReimbursementsQueuesService } from './services/reimbursements.queues.service';

@Controller()
export class QueuesController {
  constructor(private readonly queuesService: ReimbursementsQueuesService) {}

  @Get()
  getHello(): string {
    return this.queuesService.getHello();
  }
}
