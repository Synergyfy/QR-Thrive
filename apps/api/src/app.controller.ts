import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get hello message' })
  @ApiResponse({ status: 200, description: 'Return hello message.' })
  getHello(): string {
    return this.appService.getHello();
  }
}
