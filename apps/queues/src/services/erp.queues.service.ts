import { PrismaService } from '@app/common';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ErpEmployeeEntity from 'apps/auth/src/users/entity/erpEmployee.entity';
import { toTitleCase } from 'apps/shared/utils/to-title-case';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ErpQueuesService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async updateUserInformation(user_id: string, email: string) {
    const user_profile = await this.prisma.userProfile.findUnique({
      where: { user_id },
    });
    const user_comp_and_ben = await this.prisma.reimbCompAndBen.findUnique({
      where: { user_id },
    });

    const employee = this.httpService.get(
      '/api/employees/reimbursement-validation',
      {
        baseURL: this.configService.get('ERP_HR_BASE_API_URL'),
        params: {
          api_key: this.configService.get('ERP_API_KEY'),
          email,
        },
      },
    );

    const employeeResult = await firstValueFrom(employee)
      .then((response) => ({ data: response.data, status: 200 }))
      .catch((e) => ({ data: null, status: e.response?.status ?? 404 }));

    console.log(`${employeeResult?.status} - ${email}`);

    if (employeeResult?.status === 200 && employeeResult?.data) {
      const erpEmployee = employeeResult.data as ErpEmployeeEntity;

      const erpProfileData = {
        emp_id: erpEmployee?.sr,
        first_name: toTitleCase(erpEmployee?.firstName),
        last_name: toTitleCase(erpEmployee?.lastName),
        organization: toTitleCase(erpEmployee?.client),
        department: toTitleCase(erpEmployee?.department),
        position: toTitleCase(erpEmployee?.position),
      };

      if (!user_profile) {
        await this.prisma.userProfile.create({
          data: {
            ...erpProfileData,
            user: {
              connect: {
                id: user_id,
              },
            },
          },
        });
      } else {
        await this.prisma.userProfile.update({
          where: { id: user_profile.id },
          data: erpProfileData,
        });
      }

      if (erpEmployee?.personalEmail || erpEmployee?.workEmail) {
        await this.prisma.user.update({
          where: { id: user_id },
          data: {
            name: `${toTitleCase(erpEmployee?.firstName)} ${toTitleCase(
              erpEmployee?.lastName,
            )}`,
            personal_email: erpEmployee?.personalEmail,
            work_email: erpEmployee?.workEmail,
          },
        });
      }

      const erpUserCompAndBen = {
        basic_salary: erpEmployee?.basicMonthlySalary,
        phone_allowance: erpEmployee?.phoneAllowance,
        communication_allowance: erpEmployee?.communicationAllowance,
      };

      if (user_comp_and_ben) {
        await this.prisma.reimbCompAndBen.update({
          where: { id: user_comp_and_ben.id },
          data: erpUserCompAndBen,
        });
      } else {
        await this.prisma.reimbCompAndBen.create({
          data: {
            ...erpUserCompAndBen,
            user: {
              connect: {
                id: user_id,
              },
            },
          },
        });
      }
    }
  }

  async sendEmail(data: {
    from?: string;
    to: string;
    copy?: string;
    subject: string;
    body: string;
  }) {
    data.from = 'no-reply@kmc.solutions';

    const email = this.httpService.post('/api/Email/sendemailbackup', data, {
      baseURL: this.configService.get('ERP_AUTH_BASE_API_URL'),
    });

    return await firstValueFrom(email)
      .then((data) => ({
        statusText: data.statusText,
      }))
      .catch((e) => ({ statusText: e.response.statusText }));
  }
}
