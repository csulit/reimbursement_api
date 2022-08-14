import { RabbitMqService } from '@app/common';
import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CalculateTotal } from './interface/calculate-total.interface';
import { ErpQueuesService } from './services/erp.queues.service';
import { ReimbursementsQueuesService } from './services/reimbursements.queues.service';

@Controller()
export class QueuesController {
  constructor(
    private readonly reimbursementsQueuesService: ReimbursementsQueuesService,
    private readonly erpQueueService: ErpQueuesService,
    private readonly rabbitMqService: RabbitMqService,
  ) {}

  @EventPattern('calculate_total')
  calculateTotal(@Payload() data: CalculateTotal, @Ctx() context: RmqContext) {
    this.reimbursementsQueuesService.calculateTotal(data);
    this.rabbitMqService.ack(context);
  }

  @EventPattern('update_user_information')
  updateUserInformation(
    @Payload() data: { user_id: string; email: string },
    @Ctx() context: RmqContext,
  ) {
    this.erpQueueService.updateUserInformation(data.user_id, data.email);
    this.rabbitMqService.ack(context);
  }
}
