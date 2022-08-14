import { IsDateString } from 'class-validator';

export class CreateReimbursementDTO {
  @IsDateString()
  readonly filing_date: string;
}
