import { IsDateString, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsMongoId()
  @IsNotEmpty()
  buyer_id: string;

  @IsMongoId()
  @IsNotEmpty()
  seller_id: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount_coin: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  completed_at?: Date;
}
