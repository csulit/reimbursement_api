import { RabbitMqService } from '@app/common';
import { NestFactory } from '@nestjs/core';
import { QueuesModule } from './queues.module';

async function bootstrap() {
  const app = await NestFactory.create(QueuesModule);
  const rabbitMqService = app.get<RabbitMqService>(RabbitMqService);
  app.connectMicroservice(rabbitMqService.getOptions('REIMBURSEMENT'));

  await app.startAllMicroservices();
}
bootstrap();
