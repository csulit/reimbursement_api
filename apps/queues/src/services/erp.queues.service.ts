import { PrismaService } from '@app/common';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ErpEmployeeEntity from 'apps/auth/src/users/entity/erpEmployee.entity';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ErpQueuesService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async updateUserInformation(user_id: string, email: string) {
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

    if (employeeResult?.status === 200) {
      const erpEmployee = employeeResult.data as ErpEmployeeEntity;

      await this.prisma.userProfile.create({
        data: {
          first_name: erpEmployee?.firstName,
          last_name: erpEmployee?.lastName,
          organization: erpEmployee?.client,
          department: erpEmployee?.department,
          user: {
            connect: {
              id: user_id,
            },
          },
        },
      });

      if (erpEmployee?.personalEmail || erpEmployee?.workEmail) {
        await this.prisma.user.update({
          where: { id: user_id },
          data: {
            personal_email: erpEmployee?.personalEmail,
            work_email: erpEmployee?.workEmail,
          },
        });
      }

      await this.prisma.reimbCompAndBen.create({
        data: {
          basic_salary: erpEmployee?.basicMonthlySalary,
          phone_allowance: erpEmployee?.phoneAllowance,
          user: {
            connect: {
              id: user_id,
            },
          },
        },
      });
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
