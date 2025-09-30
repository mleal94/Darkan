import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRole } from '../common/types/user.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
      
      const user = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });

      const savedUser = await user.save();
      return this.mapToResponseDto(savedUser);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('El email ya está en uso');
      }
      throw error;
    }
  }

  async findUserById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.mapToResponseDto(user) : null;
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      { new: true, runValidators: true }
    ).exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.mapToResponseDto(user);
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.userModel.find().exec();
    return users.map(user => this.mapToResponseDto(user));
  }

  async updateTokenVersion(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      $inc: { tokenVersion: 1 }
    }).exec();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      lastLoginAt: new Date()
    }).exec();
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private mapToResponseDto(user: UserDocument): UserResponseDto {
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
