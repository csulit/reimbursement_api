import { PartialType } from '@nestjs/mapped-types';
import { OmitType } from '@nestjs/swagger';
import { CreateBankDetailsDTO } from './create-bank-details.dto';

export class UpdateBankDetailsDTO extends PartialType(
  OmitType(CreateBankDetailsDTO, ['user_id']),
) {}
