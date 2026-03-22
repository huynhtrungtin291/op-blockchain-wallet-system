import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop()
  nonce?: string;

  @Prop({ required: true, unique: true })
  wallet_address: string;

  @Prop({ default: 0 })
  coin_balance?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
