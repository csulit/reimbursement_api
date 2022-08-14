import { PrismaService } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { useTryAsync } from 'no-try';
import { CalculateTotal } from '../interface/calculate-total.interface';

@Injectable()
export class ReimbursementsQueuesService {
  private readonly logger = new Logger(ReimbursementsQueuesService.name);
  constructor(private readonly prisma: PrismaService) {}

  async calculateTotal(data: CalculateTotal) {
    if (!data?.reimbursement_id) {
      return false;
    }

    const { reimbursement_id } = data;

    const [error, record] = await useTryAsync(() =>
      this.prisma.reimbursement.findUnique({
        where: { id: reimbursement_id },
        select: { id: true },
        rejectOnNotFound: true,
      }),
    );

    if (record?.id) {
      const { id } = record;

      const { _sum } = await this.prisma.particular.aggregate({
        where: { reimbursement_id: id },
        _sum: { total: true },
      });

      await this.prisma.reimbursement.update({
        where: { id },
        data: {
          amount_to_be_reimbursed: _sum.total ?? 0,
          total_expense: _sum.total ?? 0,
        },
        select: {
          id: true,
          amount_to_be_reimbursed: true,
          total_expense: true,
        },
      });
    }

    if (error) {
      this.logger.error(
        error?.message || 'Something went wrong in total calculation',
      );
    }
  }
}
