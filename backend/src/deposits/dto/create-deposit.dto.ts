import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDepositDto {
  @IsMongoId()
  @IsNotEmpty()
  user_id: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount_vnd: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  coin_amount: number;

  @IsString()
  @IsOptional()
  status?: string;
}
