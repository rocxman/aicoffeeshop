import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentWebhookService } from './payment.webhook.service';
import { CreatePaymentDto, PaymentNotificationDto, RefundDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('payment')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private webhookService: PaymentWebhookService,
  ) {}

  /**
   * Create Snap payment (redirect payment page)
   */
  @Post('snap')
  @UseGuards(JwtAuthGuard)
  async createSnapPayment(@Body() dto: CreatePaymentDto) {
    const result = await this.paymentService.createSnapTransaction(dto);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Create QRIS payment
   */
  @Post('qris')
  @UseGuards(JwtAuthGuard)
  async createQRISPayment(@Body() dto: CreatePaymentDto) {
    const result = await this.paymentService.createQRISPayment(dto);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Create bank transfer (Virtual Account) payment
   */
  @Post('bank-transfer')
  @UseGuards(JwtAuthGuard)
  async createBankTransferPayment(
    @Body() dto: CreatePaymentDto,
    @Body('bank') bank: string = 'bca',
  ) {
    const result = await this.paymentService.createBankTransferPayment(dto, bank);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get payment status
   */
  @Get('status/:orderId')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(@Param('orderId') orderId: string) {
    const result = await this.paymentService.getPaymentStatus(orderId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Process refund
   */
  @Post('refund')
  @UseGuards(JwtAuthGuard)
  async processRefund(@Body() dto: RefundDto) {
    const result = await this.paymentService.processRefund(dto);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Midtrans webhook handler
   * This endpoint receives payment notifications from Midtrans
   */
  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() notification: PaymentNotificationDto,
    @Headers('signature-key') signature: string,
  ) {
    await this.webhookService.processNotification(notification);

    return { status: 'ok' };
  }

  /**
   * Check payment gateway status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  getGatewayStatus() {
    const isConfigured = this.paymentService.isConfigured();

    return {
      configured: isConfigured,
      mode: isConfigured
        ? this.paymentService['isProduction']
          ? 'PRODUCTION'
          : 'SANDBOX'
        : 'NOT_CONFIGURED',
    };
  }
}
