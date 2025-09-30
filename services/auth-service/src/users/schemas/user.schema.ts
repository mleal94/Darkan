import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../common/types/user.types';

export type UserDocument = User & Document & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ 
    type: String, 
    enum: Object.values(UserRole), 
    default: UserRole.SURGEON 
  })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  tokenVersion: number;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
