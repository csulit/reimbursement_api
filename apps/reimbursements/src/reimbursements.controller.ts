import { Controller, Get } from '@nestjs/common';
import { ReimbursementsService } from './reimbursements.service';

@Controller()
export class ReimbursementsController {
  constructor(private readonly reimbursementsService: ReimbursementsService) {}

  @Get()
  getHello(): string {
    return this.reimbursementsService.getHello();
  }
}
