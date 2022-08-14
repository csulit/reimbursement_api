import { RabbitMqService } from '@app/common';
import { NestFactory } from '@nestjs/core';
import { REIMBURSEMENT_QUEUE_SERVICE } from 'apps/reimbursements/src/constant';
import { QueuesModule } from './queues.module';

async function bootstrap() {
  const app = await NestFactory.create(QueuesModule);
  const rabbitMqService = app.get<RabbitMqService>(RabbitMqService);
  app.connectMicroservice(
    rabbitMqService.getOptions(REIMBURSEMENT_QUEUE_SERVICE),
  );

  await app.startAllMicroservices();
}
bootstrap();
