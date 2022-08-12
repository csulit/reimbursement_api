import { Injectable } from '@nestjs/common';

@Injectable()
export class QueuesService {
  getHello(): string {
    return 'Hello World!';
  }
}
