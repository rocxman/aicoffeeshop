import { Controller, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AIService } from './ai.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('ai')
export class AIController {
  constructor(private aiService: AIService) {}

  /**
   * Process chat message
   */
  @Post('chat')
  @Public()
  async chat(
    @Body('message') message: string,
    @Body('sessionId') sessionId: string,
    @Body('channel') channel: string = 'WEB',
    @Request() req: any,
  ) {
    if (!message) {
      return { error: 'Message is required' };
    }

    if (!sessionId) {
      return { error: 'Session ID is required' };
    }

    const userId = req.user?.id;

    const response = await this.aiService.processMessage(
      sessionId,
      message,
      channel,
      userId,
    );

    return {
      success: true,
      data: response,
    };
  }

  /**
   * WhatsApp webhook handler
   */
  @Post('whatsapp')
  @Public()
  async whatsappWebhook(@Body() body: any) {
    // This will be implemented in the WhatsApp module
    return { success: true, message: 'Webhook received' };
  }

  /**
   * Voice transcription (placeholder)
   */
  @Post('voice/transcribe')
  @Public()
  async transcribeVoice(@Body('audio') audio: string) {
    // This will transcribe voice to text
    return {
      success: true,
      text: 'Transcribed text from audio',
    };
  }
}
