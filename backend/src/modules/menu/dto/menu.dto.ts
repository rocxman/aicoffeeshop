import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, IsEnum, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMenuCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateMenuOptionValueDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsOptional()
  @IsNumber()
  priceModifier?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateMenuOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(['SINGLE', 'MULTIPLE'])
  type?: 'SINGLE' | 'MULTIPLE';

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsNumber()
  minSelect?: number;

  @IsOptional()
  @IsNumber()
  maxSelect?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuOptionValueDto)
  values?: CreateMenuOptionValueDto[];
}

export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsNumber()
  prepTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuOptionDto)
  options?: CreateMenuOptionDto[];
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsNumber()
  prepTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
