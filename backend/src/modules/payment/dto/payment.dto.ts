import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEmail } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;
}

export class PaymentNotificationDto {
  @IsString()
  @IsNotEmpty()
  order_id: string;

  @IsString()
  @IsNotEmpty()
  transaction_status: string;

  @IsString()
  @IsOptional()
  fraud_status?: string;

  @IsString()
  @IsNotEmpty()
  gross_amount: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  payment_type?: string;

  @IsString()
  @IsOptional()
  transaction_time?: string;

  @IsString()
  @IsOptional()
  status_message?: string;

  @IsString()
  @IsOptional()
  signature_key?: string;
}

export class RefundDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
