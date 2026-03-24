import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schema/user.schema';

export type WithdrawalDocument = HydratedDocument<Withdrawal>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Withdrawal {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: User;

  @Prop({ required: true })
  coin_amount: number;

  @Prop({ required: true })
  amount_vnd: number;

  @Prop({ default: 'pending' })
  status: string;
}

export const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);
