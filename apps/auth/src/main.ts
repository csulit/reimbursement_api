import { PrismaService, RabbitMqService } from '@app/common';
import { RMQ_REIMBURSEMENT_AUTH_SERVICE } from '@app/common/auth/constant';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { RmqOptions } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as helmet from 'helmet';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const rabbitMqService = app.get<RabbitMqService>(RabbitMqService);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: '*',
    allowedHeaders: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    credentials: true,
  });

  app.connectMicroservice<RmqOptions>(
    rabbitMqService.getOptions(RMQ_REIMBURSEMENT_AUTH_SERVICE, true),
  );

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

  app.use(cookieParser());
  app.use(helmet.contentSecurityPolicy());
  //app.use(helmet.crossOriginEmbedderPolicy());
  //app.use(helmet.crossOriginOpenerPolicy());
  //app.use(helmet.crossOriginResourcePolicy());
  app.use(helmet.dnsPrefetchControl());
  app.use(helmet.expectCt());
  app.use(helmet.frameguard());
  app.use(helmet.hidePoweredBy());
  app.use(helmet.hsts());
  app.use(helmet.ieNoOpen());
  app.use(helmet.noSniff());
  app.use(helmet.originAgentCluster());
  app.use(helmet.permittedCrossDomainPolicies());
  app.use(helmet.referrerPolicy());
  app.use(helmet.xssFilter());
  app.use(compression());

  const prismaClientService: PrismaService = app.get(PrismaService);

  prismaClientService.enableShutdownHooks(app);

  await app.startAllMicroservices();

  await app.listen(Number(configService.get('AUTH_PORT')));
}
bootstrap();
