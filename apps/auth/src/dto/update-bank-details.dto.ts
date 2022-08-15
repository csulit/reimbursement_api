import { PartialType } from '@nestjs/mapped-types';
import { CreateBankDetailsDTO } from './create-bank-details.dto';

export class UpdateBankDetailsDTO extends PartialType(CreateBankDetailsDTO) {}
