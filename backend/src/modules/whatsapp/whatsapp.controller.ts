import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppWebhookService } from './whatsapp.webhook.service';
import { WhatsAppMessageDto, WhatsAppTemplateDto } from './dto/whatsapp.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private whatsappService: WhatsAppService,
    private webhookService: WhatsAppWebhookService,
  ) {}

  /**
   * Webhook verification (GET) - Meta will send this to verify the webhook
   */
  @Get('webhook')
  @Public()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const result = this.webhookService.verifyWebhook(mode, token, challenge);

    if (result) {
      return parseInt(result, 10);
    }

    return HttpStatus.FORBIDDEN;
  }

  /**
   * Webhook handler (POST) - Receive messages from WhatsApp
   */
  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    // Note: In production, verify the signature here
    // const isValid = this.verifySignature(payload, signature);
    // if (!isValid) return HttpStatus.UNAUTHORIZED;

    await this.webhookService.processWebhook(payload);

    return { status: 'ok' };
  }

  /**
   * Send a text message (for testing)
   */
  @Post('send')
  async sendTextMessage(@Body() dto: WhatsAppMessageDto) {
    const result = await this.whatsappService.sendTextMessage(
      dto.from,
      dto.message,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Send a template message
   */
  @Post('send-template')
  async sendTemplateMessage(@Body() dto: WhatsAppTemplateDto) {
    const result = await this.whatsappService.sendTemplateMessage(
      dto.to,
      dto.templateName,
      dto.language,
      dto.parameters,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Check WhatsApp configuration status
   */
  @Get('status')
  getStatus() {
    const isConfigured = this.whatsappService.isConfigured();

    return {
      configured: isConfigured,
      phoneId: isConfigured ? '***' + this.whatsappService['config'].phoneNumberId?.slice(-4) : null,
    };
  }
}
