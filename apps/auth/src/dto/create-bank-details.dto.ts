import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBankDetailsDTO {
  @IsString()
  @IsNotEmpty()
  readonly bank_name: string;

  @IsString()
  @IsNotEmpty()
  readonly account_number: string;
}
