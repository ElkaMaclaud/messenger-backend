import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('search')
  search(
    @Query('q') query: string,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!query || query.trim().length < 2) {
      return [];
    }
    return this.usersService.searchByUsername(query.trim(), req.user.id);
  }
}
