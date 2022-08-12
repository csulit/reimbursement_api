import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { RabbitMqModule } from '../rabbit-mq/rabbit-mq.module';
import { AUTH_SERVICE } from './constant';

@Module({
  imports: [RabbitMqModule.register({ name: AUTH_SERVICE })],
  exports: [RabbitMqModule],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}
