import { IsEmail, IsUUID } from 'class-validator';

export class SendToApproverDTO {
  @IsUUID()
  readonly id: string;

  @IsEmail()
  readonly approver_email: string;
}
