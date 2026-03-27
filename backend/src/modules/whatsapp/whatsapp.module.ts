import { Module } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppWebhookService } from './whatsapp.webhook.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AIModule } from '../../modules/ai/ai.module';

@Module({
  imports: [PrismaModule, AIModule],
  providers: [WhatsAppService, WhatsAppWebhookService],
  controllers: [WhatsAppController],
  exports: [WhatsAppService, WhatsAppWebhookService],
})
export class WhatsAppModule {}
