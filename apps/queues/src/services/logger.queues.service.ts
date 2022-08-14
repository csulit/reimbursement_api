import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerQueuesService {
  getHello(): string {
    return 'Hello World!';
  }

  logger() {
    return true;
  }
}
