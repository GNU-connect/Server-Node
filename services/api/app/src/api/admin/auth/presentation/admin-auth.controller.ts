import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AdminAuthService } from 'src/api/admin/auth/application/admin-auth.service';
import { AdminRequest, AdminSessionGuard } from 'src/api/admin/common/guards/admin-session.guard';
import { NativeResponseDto } from 'src/api/common/dtos/native-response.dto';
import {
  ADMIN_SESSION_COOKIE,
  clearCookieOptions,
  sessionCookieOptions,
} from './admin-session.cookie';
import { LoginRequestDto } from './dtos/requests/login-request.dto';

@ApiTags('admin')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: '로그인 성공. admin_session 쿠키를 내려준다' })
  async login(
    @Body() body: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<NativeResponseDto<{ email: string }>> {
    const session = await this.adminAuthService.login(body.email, body.password);
    res.cookie(ADMIN_SESSION_COOKIE, session.token, sessionCookieOptions());
    return new NativeResponseDto({ email: session.email });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<NativeResponseDto<null>> {
    const token: unknown = req.cookies?.[ADMIN_SESSION_COOKIE];
    if (typeof token === 'string' && token !== '') await this.adminAuthService.logout(token);
    res.clearCookie(ADMIN_SESSION_COOKIE, clearCookieOptions());
    return new NativeResponseDto(null);
  }

  @Get('me')
  @UseGuards(AdminSessionGuard)
  @ApiCookieAuth()
  me(@Req() req: AdminRequest): NativeResponseDto<{ email: string }> {
    return new NativeResponseDto({ email: req.adminUser.email });
  }
}
