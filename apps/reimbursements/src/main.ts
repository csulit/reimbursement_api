import { PrismaService } from '@app/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ReimbursementsModule } from './reimbursements.module';

async function bootstrap() {
  const app = await NestFactory.create(ReimbursementsModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Reimbursement API')
    .setDescription('The reimbursement API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const prismaClientService: PrismaService = app.get(PrismaService);

  prismaClientService.enableShutdownHooks(app);

  await app.listen(3000);
}
bootstrap();
