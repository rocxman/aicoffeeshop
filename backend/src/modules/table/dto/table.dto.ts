import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsBoolean } from 'class-validator';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  number: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'])
  status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
}

export class UpdateTableDto {
  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  @IsEnum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'])
  status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ScanQRDto {
  @IsString()
  @IsNotEmpty()
  tableCode: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  browser?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class GenerateQRDto {
  @IsOptional()
  @IsString()
  baseUrl?: string;
}
