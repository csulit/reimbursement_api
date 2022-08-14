import { Injectable } from '@nestjs/common';

@Injectable()
export class ReimbursementsQueuesService {
  getHello(): string {
    return 'Hello World!';
  }

  logger() {
    return true;
  }
}
