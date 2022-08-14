import { IsEmail } from 'class-validator';

export class EmailQueryDTO {
  @IsEmail()
  readonly email: string;
}
