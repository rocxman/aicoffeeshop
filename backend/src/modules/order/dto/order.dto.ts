import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemOptionDto {
  @IsString()
  @IsNotEmpty()
  optionValueId: string;

  @IsOptional()
  @IsNumber()
  priceModifier?: number;
}

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemOptionDto)
  options?: OrderItemOptionDto[];
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsEnum(['WHATSAPP', 'QR', 'WEB', 'VOICE', 'MOBILE_APP'])
  @IsNotEmpty()
  channel: 'WHATSAPP' | 'QR' | 'WEB' | 'VOICE' | 'MOBILE_APP';

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerNotes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsNumber()
  discount?: number;
}

export class UpdateOrderStatusDto {
  @IsEnum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
  @IsNotEmpty()
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
}
