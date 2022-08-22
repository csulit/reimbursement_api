import { ToBoolean } from 'apps/shared/decorator/to-boolean.decorator';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsNumber, IsString } from 'class-validator';

export class CreateRequestApproverDTO {
  @IsNumber()
  @Type(() => Number)
  order: number;

  @IsString()
  approver_email?: string;

  @IsString()
  display_name?: string;

  @IsString()
  approver_department?: string;

  @IsBoolean()
  @ToBoolean()
  executive_level: boolean;

  @IsBoolean()
  @ToBoolean()
  is_approved: boolean;

  @IsBoolean()
  @ToBoolean()
  skipped: boolean;

  @IsDateString()
  time_stamp: Date;
}
