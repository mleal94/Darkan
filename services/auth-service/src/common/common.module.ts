import { Module, Global } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Global()
@Module({
  providers: [HttpExceptionFilter, JwtAuthGuard, RolesGuard],
  exports: [HttpExceptionFilter, JwtAuthGuard, RolesGuard],
})
export class CommonModule {}
