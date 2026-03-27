import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AIService } from '../../modules/ai/ai.service';
import { WhatsAppService } from './whatsapp.service';
import {
  WhatsAppWebhookPayload,
  WhatsAppMessage,
  WhatsAppContact,
  WhatsAppStatus,
} from './interfaces/whatsapp.interface';

@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private aiService: AIService,
    private whatsappService: WhatsAppService,
  ) {}

  /**
   * Verify webhook subscription (GET request)
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }

    this.logger.error('Webhook verification failed');
    return null;
  }

  /**
   * Process incoming webhook payload (POST request)
   */
  async processWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    if (payload.object !== 'whatsapp_business_account') {
      this.logger.debug('Ignoring non-WhatsApp webhook payload');
      return;
    }

    for (const entry of payload.entry) {
      const change = entry.changes?.[0];
      if (!change?.value) continue;

      const value = change.value;

      // Process messages
      if (value.messages) {
        for (const message of value.messages) {
          await this.handleMessage(message, value.contacts || []);
        }
      }

      // Process status updates
      if (value.statuses) {
        for (const status of value.statuses) {
          await this.handleStatusUpdate(status);
        }
      }
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(
    message: WhatsAppMessage,
    contacts: WhatsAppContact[],
  ): Promise<void> {
    const contact = contacts.find((c) => c.wa_id === message.from);
    const phoneNumber = message.from;

    this.logger.log(`Received message from ${phoneNumber}: ${message.text?.body || message.type}`);

    // Find or create user
    let user = await this.prisma.user.findFirst({
      where: { phone: phoneNumber },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: phoneNumber,
          name: contact?.profile?.name || `User ${phoneNumber}`,
          role: 'CUSTOMER',
        },
      });

      // Create loyalty points for new user
      await this.prisma.loyaltyPoint.create({
        data: {
          userId: user.id,
          points: 50, // Welcome bonus
          lifetimePoints: 50,
          tier: 'BRONZE',
        },
      });

      this.logger.log(`Created new user: ${user.id}`);
    }

    // Create or get session for this phone number
    const sessionId = `whatsapp_${phoneNumber}`;
    let session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      session = await this.prisma.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          channel: 'WHATSAPP',
          context: {},
          isActive: true,
        },
      });
    } else {
      // Update session last active
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { lastActiveAt: new Date() },
      });
    }

    // Get message content
    const messageContent = this.extractMessageContent(message);

    if (!messageContent) {
      this.logger.debug('No processable message content');
      return;
    }

    // Process with AI
    try {
      const aiResponse = await this.aiService.processMessage(
        sessionId,
        messageContent,
        'WHATSAPP',
        user.id,
      );

      // Send AI response back to WhatsApp
      await this.sendAIResponse(phoneNumber, aiResponse);

      this.logger.debug(`AI response sent to ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Error processing AI response: ${error.message}`);

      // Send error message
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        'Maaf, terjadi kesalahan. Silakan coba lagi nanti.',
      );
    }
  }

  /**
   * Extract message content from different message types
   */
  private extractMessageContent(message: WhatsAppMessage): string | null {
    switch (message.type) {
      case 'text':
        return message.text?.body || null;

      case 'image':
        return `[Image received: ${message.image?.caption || 'No caption'}]`;

      case 'audio':
        return `[Audio message received]`;

      case 'location':
        return `[Location: ${message.location?.latitude}, ${message.location?.longitude}]`;

      case 'button':
      case 'interactive':
        return `[Button interaction received]`;

      default:
        this.logger.debug(`Unsupported message type: ${message.type}`);
        return null;
    }
  }

  /**
   * Send AI response to WhatsApp
   */
  private async sendAIResponse(phoneNumber: string, aiResponse: any): Promise<void> {
    const { reply, toolCalls, shouldEndConversation } = aiResponse;

    // Send the main reply
    if (reply) {
      // Split long messages into chunks (WhatsApp limit: 4096 chars)
      const chunks = this.splitMessage(reply, 1000);
      for (const chunk of chunks) {
        await this.whatsappService.sendTextMessage(phoneNumber, chunk);
        // Small delay between messages
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Handle tool calls if any
    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        this.logger.debug(`Tool call: ${toolCall.name}`, toolCall.arguments);
        // Tool execution is handled by AI service
      }
    }

    // If conversation should end, send a closing message
    if (shouldEndConversation) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        'Terima kasih telah menghubungi kami. Ada yang bisa saya bantu lagi?',
      );
    }
  }

  /**
   * Split message into chunks
   */
  private splitMessage(message: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';

    const lines = message.split('\n');
    for (const line of lines) {
      if ((currentChunk + line).length > maxLength) {
        chunks.push(currentChunk);
        currentChunk = line + '\n';
      } else {
        currentChunk += line + '\n';
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Handle message status updates
   */
  private async handleStatusUpdate(status: WhatsAppStatus): Promise<void> {
    this.logger.debug(
      `Message ${status.id} status: ${status.status} for recipient ${status.recipient_id}`,
    );

    // Store status update in database for analytics
    await this.prisma.systemSetting.upsert({
      where: { key: `whatsapp_status_${status.id}` },
      update: {
        value: {
          status: status.status,
          timestamp: status.timestamp,
          recipientId: status.recipient_id,
        },
      },
      create: {
        key: `whatsapp_status_${status.id}`,
        category: 'whatsapp_status',
        value: {
          status: status.status,
          timestamp: status.timestamp,
          recipientId: status.recipient_id,
        },
      },
    });

    // Handle failed messages
    if (status.status === 'failed') {
      this.logger.error(
        `Message failed: ${JSON.stringify(status.errors)}`,
      );
    }
  }
}
