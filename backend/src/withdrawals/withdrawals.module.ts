import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalsController } from './withdrawals.controller';
import { Withdrawal, WithdrawalSchema } from './schema/withdrawal.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Withdrawal.name, schema: WithdrawalSchema }])],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
})
export class WithdrawalsModule {}
