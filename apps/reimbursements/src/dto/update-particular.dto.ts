import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateParticularDTO } from './create-particular.dto';

export class UpdateParticularDTO extends PartialType(
  OmitType(CreateParticularDTO, ['reimbursement_id']),
) {}
