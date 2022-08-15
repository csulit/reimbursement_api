import { Transform, Type } from 'class-transformer';
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
  @Transform(({ value }) => value === 'true')
  executive_level: boolean;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_approved: boolean;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  skipped: boolean;

  @IsDateString()
  time_stamp: Date;
}
