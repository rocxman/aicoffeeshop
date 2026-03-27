import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppConfig, WhatsAppSendMessageRequest, WhatsAppSendMessageResponse } from './interfaces/whatsapp.interface';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private config: WhatsAppConfig;
  private baseURL: string;

  constructor(private configService: ConfigService) {
    this.config = {
      accessToken: this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') || '',
      phoneNumberId: this.configService.get<string>('WHATSAPP_PHONE_ID') || '',
      businessAccountId: this.configService.get<string>('WHATSAPP_BUSINESS_ID') || '',
      webhookVerifyToken: this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN') || '',
      apiVersion: this.configService.get<string>('WHATSAPP_API_VERSION', 'v18.0'),
      baseURL: this.configService.get<string>('WHATSAPP_BASE_URL', 'https://graph.facebook.com'),
    };

    this.baseURL = `${this.config.baseURL}/${this.config.apiVersion}/${this.config.phoneNumberId}`;
  }

  /**
   * Send a text message via WhatsApp
   */
  async sendTextMessage(to: string, message: string): Promise<WhatsAppSendMessageResponse> {
    const payload: WhatsAppSendMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        body: message,
        preview_url: false,
      },
    };

    return this.sendMessage(payload);
  }

  /**
   * Send a template message via WhatsApp
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string = 'id',
    parameters?: Record<string, string>,
  ): Promise<WhatsAppSendMessageResponse> {
    const payload: WhatsAppSendMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: language,
        },
        ...(parameters && {
          components: [
            {
              type: 'body',
              parameters: Object.entries(parameters).map(([key, value]) => ({
                type: 'text',
                text: value,
              })),
            },
          ],
        }),
      },
    };

    return this.sendMessage(payload);
  }

  /**
   * Send an image message via WhatsApp
   */
  async sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<WhatsAppSendMessageResponse> {
    const payload: WhatsAppSendMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption,
      },
    };

    return this.sendMessage(payload);
  }

  /**
   * Send an interactive button message via WhatsApp
   */
  async sendButtonMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
  ): Promise<WhatsAppSendMessageResponse> {
    const payload: WhatsAppSendMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText,
        },
        action: {
          buttons: buttons.map((btn) => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title,
            },
          })),
        },
      },
    };

    return this.sendMessage(payload);
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId: string): Promise<any> {
    const url = `${this.baseURL}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      this.logger.error(`Failed to mark message as read: ${error.error?.message || 'Unknown error'}`);
      throw new Error(`Failed to mark message as read: ${error.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Send a reaction to a message
   */
  async sendMessageReaction(messageId: string, emoji: string, to: string): Promise<WhatsAppSendMessageResponse> {
    const payload: WhatsAppSendMessageRequest = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'reaction',
      reaction: {
        message_id: messageId,
        emoji,
      },
    } as any;

    return this.sendMessage(payload);
  }

  /**
   * Generic send message method
   */
  private async sendMessage(payload: WhatsAppSendMessageRequest): Promise<WhatsAppSendMessageResponse> {
    const url = `${this.baseURL}/messages`;

    try {
      this.logger.debug(`Sending WhatsApp message to ${payload.to}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`Failed to send message: ${error.error?.message || 'Unknown error'}`);
        throw new Error(`Failed to send message: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      this.logger.debug(`Message sent successfully. Message ID: ${result.messages?.[0]?.id}`);

      return result;
    } catch (error) {
      this.logger.error(`Error sending WhatsApp message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get phone number details
   */
  async getPhoneNumberDetails(): Promise<any> {
    const url = `${this.baseURL}?fields=display_phone_number,verified_name,code_verification_status,quality_rating`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get phone details: ${error.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  /**
   * Check if WhatsApp is configured
   */
  isConfigured(): boolean {
    return !!(this.config.accessToken && this.config.phoneNumberId);
  }

  /**
   * Get webhook verify token
   */
  getWebhookVerifyToken(): string {
    return this.config.webhookVerifyToken;
  }
}
