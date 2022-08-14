import { RabbitMqService } from '@app/common';
import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CalculateTotal } from './interface/calculate-total.interface';
import { ReimbursementsQueuesService } from './services/reimbursements.queues.service';

@Controller()
export class QueuesController {
  constructor(
    private readonly reimbursementsQueuesService: ReimbursementsQueuesService,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  @EventPattern('calculate_total')
  calculateTotal(@Payload() data: CalculateTotal, @Ctx() context: RmqContext) {
    this.reimbursementsQueuesService.calculateTotal(data);
    this.rabbitMqService.ack(context);
  }
}
