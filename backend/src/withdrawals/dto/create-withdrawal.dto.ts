import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @IsMongoId()
  @IsNotEmpty()
  user_id: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  coin_amount: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount_vnd: number;

  @IsString()
  @IsOptional()
  status?: string;
}
