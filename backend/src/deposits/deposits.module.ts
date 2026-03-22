import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DepositsService } from './deposits.service';
import { DepositsController } from './deposits.controller';
import { Deposit, DepositSchema } from './schema/deposit.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Deposit.name, schema: DepositSchema }])],
  controllers: [DepositsController],
  providers: [DepositsService],
})
export class DepositsModule {}
