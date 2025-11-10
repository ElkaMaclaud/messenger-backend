import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: { username: string; password: string }) {
    return this.authService.register(dto.username, dto.password);
  }

  @Post('login')
  login(@Body() dto: { username: string; password: string }) {
    return this.authService.login(dto.username, dto.password);
  }
}
