import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  wallet_address: string;

  @IsOptional()
  @IsString()
  nonce?: string;

  @IsNumber()
  @IsOptional()
  coin_balance?: number;

  @IsOptional()
  @IsString()
  jwt?: string;
}
