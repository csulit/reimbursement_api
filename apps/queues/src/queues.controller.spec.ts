import { Test, TestingModule } from '@nestjs/testing';
import { QueuesController } from './queues.controller';
import { ReimbursementsQueuesService } from './services/reimbursements.queues.service';

describe('QueuesController', () => {
  let queuesController: QueuesController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [QueuesController],
      providers: [ReimbursementsQueuesService],
    }).compile();

    queuesController = app.get<QueuesController>(QueuesController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(queuesController.getHello()).toBe('Hello World!');
    });
  });
});
