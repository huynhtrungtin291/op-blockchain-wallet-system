import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schema/user.schema';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyer_id: User;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller_id: User;

  @Prop({ required: true })
  amount_coin: number;

  @Prop({ default: 'pending' })
  status: string;

  @Prop()
  completed_at: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
