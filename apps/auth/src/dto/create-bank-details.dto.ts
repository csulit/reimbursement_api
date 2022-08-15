import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateBankDetailsDTO {
  @IsUUID()
  readonly user_id: string;

  @IsString()
  @IsNotEmpty()
  readonly bank_name: string;

  @IsString()
  @IsNotEmpty()
  readonly account_number: string;
}
