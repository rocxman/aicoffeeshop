import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentWebhookService } from './payment.webhook.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrderModule } from '../../modules/order/order.module';

@Module({
  imports: [PrismaModule, OrderModule],
  providers: [PaymentService, PaymentWebhookService],
  controllers: [PaymentController],
  exports: [PaymentService, PaymentWebhookService],
})
export class PaymentModule {}
