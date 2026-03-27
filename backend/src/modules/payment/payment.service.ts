import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as midtransClient from 'midtrans-client';
import { CreatePaymentDto, RefundDto } from './dto/payment.dto';
import { SnapPaymentResponse, PaymentStatus, RefundRequest } from './interfaces/payment.interface';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private snap: midtransClient.Snap;
  private coreApi: midtransClient.CoreApi;
  private isProduction: boolean;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    const clientKey = this.configService.get<string>('MIDTRANS_CLIENT_KEY');
    this.isProduction = this.configService.get<boolean>('MIDTRANS_IS_PRODUCTION', false);

    if (!serverKey) {
      this.logger.warn('MIDTRANS_SERVER_KEY not configured. Payment features will be disabled.');
      return;
    }

    // Initialize Snap (for redirect payments)
    this.snap = new midtransClient.Snap({
      isProduction: this.isProduction,
      serverKey,
      clientKey,
    });

    // Initialize Core API (for direct API calls)
    this.coreApi = new midtransClient.CoreApi({
      isProduction: this.isProduction,
      serverKey,
      clientKey,
    });

    this.logger.log(`Midtrans initialized in ${this.isProduction ? 'PRODUCTION' : 'SANDBOX'} mode`);
  }

  /**
   * Create Snap payment transaction
   * Returns redirect URL for customer to complete payment
   */
  async createSnapTransaction(dto: CreatePaymentDto): Promise<SnapPaymentResponse> {
    if (!this.snap) {
      throw new BadRequestException('Payment gateway not configured');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: {
          include: {
            item: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not pending payment');
    }

    // Build Snap parameters
    const parameter = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: order.totalPrice,
      },
      customer_details: {
        first_name: order.customerName || order.user?.name || 'Customer',
        email: order.customerPhone || order.user?.email,
        phone: order.customerPhone,
      },
      items: order.items.map((item) => ({
        id: item.itemId,
        price: item.totalPrice,
        quantity: item.quantity,
        name: item.item.name,
      })),
      callbacks: {
        finish: `${this.configService.get('FRONTEND_URL', 'http://localhost:3001')}/payment/success`,
        error: `${this.configService.get('FRONTEND_URL', 'http://localhost:3001')}/payment/error`,
        pending: `${this.configService.get('FRONTEND_URL', 'http://localhost:3001')}/payment/pending`,
      },
      enabled_payments: ['qris', 'gopay', 'shopeepay', 'dana', 'ovo', 'credit_card', 'debit_card', 'bank_transfer'],
    };

    try {
      const transaction = await this.snap.createTransaction(parameter);

      // Store payment record
      await this.prisma.payment.create({
        data: {
          orderId: dto.orderId,
          userId: order.userId,
          method: 'PENDING' as any,
          status: 'PENDING' as any,
          amount: order.totalPrice,
          provider: 'midtrans',
          providerId: transaction.token,
          metadata: {
            snapToken: transaction.token,
            redirectUrl: transaction.redirect_url,
          },
        },
      });

      this.logger.log(`Snap transaction created: ${transaction.token}`);

      return {
        token: transaction.token,
        redirect_url: transaction.redirect_url,
        status_code: transaction.status_code,
        status_message: transaction.status_message,
      };
    } catch (error) {
      this.logger.error(`Failed to create Snap transaction: ${error.message}`);
      throw new BadRequestException(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Create QRIS payment
   */
  async createQRISPayment(dto: CreatePaymentDto): Promise<any> {
    if (!this.coreApi) {
      throw new BadRequestException('Payment gateway not configured');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const parameter = {
      payment_type: 'qris',
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: order.totalPrice,
      },
      customer_details: {
        first_name: order.customerName || 'Customer',
        phone: order.customerPhone,
      },
      qris: {
        acquirer: 'gopay', // Can be any e-wallet
      },
    };

    try {
      const charge = await this.coreApi.charge(parameter);

      // Store payment record
      await this.prisma.payment.create({
        data: {
          orderId: dto.orderId,
          method: 'QRIS' as any,
          status: 'PENDING' as any,
          amount: order.totalPrice,
          provider: 'midtrans',
          providerId: charge.transaction_id,
          metadata: charge,
        },
      });

      this.logger.log(`QRIS payment created: ${charge.transaction_id}`);

      return {
        qrString: charge.actions?.find((a: any) => a.name === 'generate-qr-string')?.url,
        deeplinkRedirectUrl: charge.actions?.find((a: any) => a.name === 'deeplink-redirect')?.url,
        transactionId: charge.transaction_id,
      };
    } catch (error) {
      this.logger.error(`Failed to create QRIS payment: ${error.message}`);
      throw new BadRequestException(`Failed to create QRIS payment: ${error.message}`);
    }
  }

  /**
   * Create bank transfer (Virtual Account) payment
   */
  async createBankTransferPayment(dto: CreatePaymentDto, bank: string = 'bca'): Promise<any> {
    if (!this.coreApi) {
      throw new BadRequestException('Payment gateway not configured');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const parameter = {
      payment_type: 'bank_transfer',
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: order.totalPrice,
      },
      customer_details: {
        first_name: order.customerName || 'Customer',
        phone: order.customerPhone,
      },
      bank_transfer: {
        bank,
        va_number: this.generateVANumber(order.orderNumber),
      },
    };

    try {
      const charge = await this.coreApi.charge(parameter);

      await this.prisma.payment.create({
        data: {
          orderId: dto.orderId,
          method: `BANK_TRANSFER_${bank.toUpperCase()}` as any,
          status: 'PENDING' as any,
          amount: order.totalPrice,
          provider: 'midtrans',
          providerId: charge.transaction_id,
          metadata: {
            vaNumbers: charge.va_numbers,
            bank,
          },
        },
      });

      this.logger.log(`Bank transfer payment created: ${charge.transaction_id}`);

      return {
        vaNumber: charge.va_numbers?.[0]?.va_number,
        bank,
        transactionId: charge.transaction_id,
      };
    } catch (error) {
      this.logger.error(`Failed to create bank transfer payment: ${error.message}`);
      throw new BadRequestException(`Failed to create bank transfer payment: ${error.message}`);
    }
  }

  /**
   * Process payment notification (webhook)
   */
  async processNotification(notification: any): Promise<void> {
    this.logger.log(`Processing payment notification for order: ${notification.order_id}`);

    // Find order by orderNumber
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: notification.order_id },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update payment status
    const paymentStatus = this.mapTransactionStatus(notification.transaction_status, notification.fraud_status);

    const existingPayment = await this.prisma.payment.findFirst({
      where: { orderId: order.id },
    });

    if (existingPayment) {
      const newMetadata = existingPayment.metadata
        ? Object.assign({}, existingPayment.metadata, notification)
        : notification;

      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: paymentStatus as any,
          paidAmount: paymentStatus === 'PAID' ? parseInt(notification.gross_amount) : 0,
          paidAt: paymentStatus === 'PAID' ? new Date(notification.transaction_time) : null,
          metadata: newMetadata as any,
        },
      });
    } else {
      // Create payment record if not exists
      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          method: notification.payment_type || 'UNKNOWN',
          status: paymentStatus as any,
          amount: parseInt(notification.gross_amount),
          provider: 'midtrans',
          providerId: notification.order_id,
          metadata: notification,
        },
      });
    }

    // Update order status based on payment
    if (paymentStatus === 'PAID') {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CONFIRMED',
          paidAt: new Date(notification.transaction_time),
        },
      });

      this.logger.log(`Order ${order.orderNumber} payment confirmed`);
    } else if (paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED') {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
        },
      });

      this.logger.log(`Order ${order.orderNumber} payment failed/expired`);
    }
  }

  /**
   * Process refund
   */
  async processRefund(dto: RefundDto): Promise<any> {
    if (!this.coreApi) {
      throw new BadRequestException('Payment gateway not configured');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.payment || order.payment.status !== 'PAID') {
      throw new BadRequestException('Order payment not found or not paid');
    }

    const refundRequest: RefundRequest = {
      orderId: order.orderNumber,
      refundAmount: dto.amount,
      reason: dto.reason || 'Customer request',
    };

    try {
      const refund = await this.coreApi.refund(order.orderNumber, {
        refund_key: `refund-${Date.now()}`,
        amount: dto.amount,
        reason: dto.reason,
      });

      // Update payment record
      await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: dto.amount >= order.totalPrice ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundAmount: (order.payment.refundAmount || 0) + dto.amount,
        },
      });

      // Update order if full refund
      if (dto.amount >= order.totalPrice) {
        await this.prisma.order.update({
          where: { id: dto.orderId },
          data: { status: 'REFUNDED' as any },
        });
      }

      this.logger.log(`Refund processed for order ${order.orderNumber}`);

      return refund;
    } catch (error) {
      this.logger.error(`Failed to process refund: ${error.message}`);
      throw new BadRequestException(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(orderId: string): Promise<PaymentStatus | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.payment) {
      return null;
    }

    return {
      orderId: order.id,
      transactionStatus: order.payment.status,
      paymentType: order.payment.method,
      transactionTime: order.payment.paidAt,
      grossAmount: order.payment.amount,
      currency: 'IDR',
      statusCode: order.payment.status === 'PAID' ? '200' : '201',
    };
  }

  /**
   * Map Midtrans status to our internal status
   */
  private mapTransactionStatus(midtransStatus: string, fraudStatus?: string): string {
    switch (midtransStatus) {
      case 'settlement':
        return 'PAID';
      case 'capture':
        return fraudStatus === 'accept' ? 'PAID' : 'PENDING';
      case 'pending':
        return 'PENDING';
      case 'deny':
      case 'expire':
      case 'cancel':
        return 'FAILED';
      case 'refund':
        return 'REFUNDED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Generate Virtual Account number
   */
  private generateVANumber(orderNumber: string): string {
    // Generate a simple VA number (adjust based on bank requirements)
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return orderNumber.replace(/[^0-9]/g, '').slice(-8) + random;
  }

  /**
   * Check if payment gateway is configured
   */
  isConfigured(): boolean {
    return !!this.snap && !!this.coreApi;
  }
}
