import { Test, TestingModule } from '@nestjs/testing';
import { ReimbursementsController } from './reimbursements.controller';
import { ReimbursementsService } from './reimbursements.service';

describe('ReimbursementsController', () => {
  let reimbursementsController: ReimbursementsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ReimbursementsController],
      providers: [ReimbursementsService],
    }).compile();

    reimbursementsController = app.get<ReimbursementsController>(ReimbursementsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(reimbursementsController.getHello()).toBe('Hello World!');
    });
  });
});
