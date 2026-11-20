import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { SupportService } from './support.service';
import { SupportKnowledgeService } from './support-knowledge.service';

@Controller('support')
export class SupportController {
  private publicBuckets = new Map<string, { count: number; until: number }>();
  constructor(
    private support: SupportService,
    private knowledge: SupportKnowledgeService,
  ) {}
  private publicLimit(req: any) {
    const now = Date.now();
    if (this.publicBuckets.size > 10000)
      for (const [key, value] of this.publicBuckets)
        if (value.until <= now) this.publicBuckets.delete(key);
    // Use the socket address configured by the trusted server, never a client supplied header.
    const ip = String(req.ip || req.socket?.remoteAddress || 'unknown');
    let bucket = this.publicBuckets.get(ip);
    if (!bucket || bucket.until <= now) {
      bucket = { count: 0, until: now + 60000 };
      this.publicBuckets.set(ip, bucket);
    }
    if (++bucket.count > 30 || this.publicBuckets.size > 10000)
      throw new BadRequestException(
        'Has enviado varias solicitudes. Espera un minuto antes de continuar.',
      );
  }
  @Get('chat')
  @UseGuards(JwtAuthGuard)
  async getChat(@Req() req: any) {
    return this.support.accountHistory(await this.support.account(req));
  }
  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(@Req() req: any, @Body() input: any) {
    return this.support.accountTurn(
      await this.support.account(req),
      input || {},
    );
  }
  @Public()
  @Post('public-history')
  publicHistory(@Body('visitorId') visitorId?: string) {
    return this.support.publicHistory(visitorId);
  }
  @Public()
  @Post('public-chat')
  publicChat(@Req() req: any, @Body() input: any) {
    this.publicLimit(req);
    return this.support.publicTurn(input?.visitorId, input || {});
  }
  @Post('admin-reply')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  adminReply(
    @Req() req: any,
    @Body('sessionId') id: string,
    @Body('message') message: string,
    @Body('clientMessageId') clientMessageId?: string,
  ) {
    return this.support.adminReply(
      id || '',
      message,
      req.user.sub,
      clientMessageId,
    );
  }
  @Post('active-sessions')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  getActiveSessions(
    @Req() _req: any,
    @Body('sessionId') id?: string,
    @Body('filter') filter?: string,
  ) {
    return this.support.sessions(id, filter);
  }
  @Post('conversations/:id/action')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  action(
    @Req() req: any,
    @Param('id') id: string,
    @Body('action') action: string,
  ) {
    return this.support.adminAction(id, action, req.user.sub);
  }
  @Get('settings')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  settings() {
    return this.knowledge.configuration();
  }
  @Put('settings')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  updateSettings(@Req() req: any, @Body() input: any) {
    return this.knowledge.updateSettings(input || {}, req.user.sub);
  }
  @Post('check-gemini')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  checkGemini(@Body() input: any) {
    return this.knowledge.checkKey(input || {});
  }
  @Get('articles')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  articles() {
    return this.knowledge.articles();
  }
  @Post('articles')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  createArticle(@Req() req: any, @Body() input: any) {
    return this.knowledge.saveArticle(null, input || {}, req.user.sub);
  }
  @Patch('articles/:id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  updateArticle(@Req() req: any, @Param('id') id: string, @Body() input: any) {
    return this.knowledge.saveArticle(id, input || {}, req.user.sub);
  }
}
