import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/types/user.types';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.usersService.getAllUsers();
  }

  @Get('me')
  async getCurrentUser(@Request() req): Promise<UserResponseDto> {
    return this.usersService.findUserById(req.user.sub);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SCHEDULER)
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findUserById(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return user;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteUser(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.deleteUser(id);
    return { message: 'Usuario eliminado correctamente' };
  }

  @Get('admin/test')
  async testEndpoint(): Promise<{ message: string; timestamp: string }> {
    return {
      message: 'Auth Service is working correctly',
      timestamp: new Date().toISOString(),
    };
  }
}
