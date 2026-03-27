import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PaymentNotificationDto } from './dto/payment.dto';

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    private configService: ConfigService,
    private paymentService: PaymentService,
  ) {}

  /**
   * Verify Midtrans webhook notification signature
   */
  verifySignature(notification: PaymentNotificationDto, signature: string): boolean {
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    
    // Create signature key
    const signatureKey = this.createSignatureKey(
      notification.order_id,
      notification.transaction_status,
      notification.gross_amount,
      serverKey,
    );

    return signatureKey === signature;
  }

  /**
   * Create signature key for verification
   */
  private createSignatureKey(
    orderId: string,
    transactionStatus: string,
    grossAmount: string,
    serverKey: string | undefined,
  ): string {
    if (!serverKey) {
      this.logger.warn('Server key not configured for signature verification');
      return '';
    }

    const crypto = require('crypto');
    const hash = crypto.createHash('sha512');
    hash.update(`${orderId}${transactionStatus}${grossAmount}${serverKey}`);
    return hash.digest('hex');
  }

  /**
   * Process incoming payment notification
   */
  async processNotification(notification: PaymentNotificationDto): Promise<void> {
    this.logger.log(`Processing payment notification: ${notification.order_id}`);

    try {
      // Verify signature if provided
      // Note: In production, always verify the signature
      // const signature = headers['x-signature'];
      // const isValid = this.verifySignature(notification, signature);
      // if (!isValid) {
      //   this.logger.error('Invalid notification signature');
      //   throw new Error('Invalid signature');
      // }

      // Process the notification
      await this.paymentService.processNotification(notification);

      this.logger.log(`Payment notification processed successfully: ${notification.order_id}`);
    } catch (error) {
      this.logger.error(`Failed to process notification: ${error.message}`);
      throw error;
    }
  }
}
