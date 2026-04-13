import { Controller, Post, Body, Res, Req, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SignupDto,
  LoginDto,
  AdminSignupDto,
  GoogleLoginDto,
} from './dto/auth.dto';
import type { Response, Request } from 'express';
import { Public } from './decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    userId: string;
  };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created and tokens set in cookies.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input or user exists.' })
  async signup(
    @Body() signupDto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signup(signupDto, res);
  }

  @Public()
  @Post('signup-admin')
  @ApiOperation({ summary: 'Register a new admin user' })
  @ApiResponse({
    status: 201,
    description: 'Admin user successfully created and tokens set in cookies.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid admin secret.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or user exists.',
  })
  async signupAdmin(
    @Body() adminSignupDto: AdminSignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signupAdmin(adminSignupDto, res);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate a user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, tokens set in cookies.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(loginDto, res);
  }

  @Public()
  @Post('google')
  @ApiOperation({ summary: 'Login or signup with Google' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.googleLogin(googleLoginDto, res);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed and updated in cookies.',
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req as any).cookies['refreshToken'];
    return this.authService.refresh(refreshToken, res);
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Logout a user and clear cookies' })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = (req as any).cookies['refreshToken'];
    return this.authService.logout(refreshToken, res);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async me(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.authService.getUserById(userId);
  }

  @Public()
  @Get('magic-login')
  @ApiOperation({ summary: 'Validate magic link and log user in' })
  @ApiResponse({ status: 302, description: 'Redirect to dashboard or login on error' })
  async magicLogin(@Query('token') token: string, @Res() res: Response) {
    return this.authService.validateMagicLink(token, res);
  }
}
