import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schema/user.schema';

export type DepositDocument = HydratedDocument<Deposit>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Deposit {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: User;

  @Prop({ required: true })
  amount_vnd: number;

  @Prop({ required: true })
  coin_amount: number;

  @Prop({ default: 'pending' })
  status: string;
}

export const DepositSchema = SchemaFactory.createForClass(Deposit);
