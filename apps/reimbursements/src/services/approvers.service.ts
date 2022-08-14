import { PrismaService } from '@app/common';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UpdateApproverDTO } from '../dto/update-approver.dto';

@Injectable()
export class ApproversService {
  constructor(private readonly prisma: PrismaService) {}

  async updateApprover(user_id: string, data: UpdateApproverDTO) {
    return await this.prisma.user.update({
      where: { id: user_id },
      data: {
        approvers: {
          order: 1,
          ...(data as unknown as Prisma.JsonObject),
        },
      },
      select: {
        id: true,
        approvers: true,
      },
    });
  }
}
