import { Controller, Post, Body, Res, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto/auth.dto';
import type { Response, Request } from 'express';
import { Public } from './decorators/public.decorator';

interface RequestWithUser extends Request {
  user: {
    userId: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(@Body() signupDto: SignupDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.signup(signupDto, res);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(loginDto, res);
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req as any).cookies['refreshToken'];
    return this.authService.refresh(refreshToken, res);
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req as any).cookies['refreshToken'];
    return this.authService.logout(refreshToken, res);
  }

  @Get('me')
  async me(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.authService.getUserById(userId);
  }
}
