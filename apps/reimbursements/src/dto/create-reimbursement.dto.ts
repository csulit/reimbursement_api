import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateReimbursementDTO {
  @IsDateString()
  readonly filing_date: string;

  @IsString()
  @IsNotEmpty()
  readonly default_first_approver: string;
}
