import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from './dto/menu.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/guards/roles.guard';

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  // ============================================
  // CATEGORIES
  // ============================================

  @Get('categories')
  @Public()
  async getCategories(@Query('includeItems') includeItems: string = 'true') {
    return this.menuService.getAllCategories(includeItems === 'true');
  }

  @Get('categories/:id')
  @Public()
  async getCategoryById(@Param('id') id: string) {
    return this.menuService.getCategoryById(id);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async createCategory(@Body() dto: CreateMenuCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateMenuCategoryDto) {
    return this.menuService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async deleteCategory(@Param('id') id: string) {
    return this.menuService.deleteCategory(id);
  }

  // ============================================
  // MENU ITEMS
  // ============================================

  @Get('items')
  @Public()
  async getItems(
    @Query('categoryId') categoryId?: string,
    @Query('isPopular') isPopular?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    const filters: any = {};
    if (categoryId) filters.categoryId = categoryId;
    if (isPopular !== undefined) filters.isPopular = isPopular === 'true';
    if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';
    if (search) filters.search = search;
    if (minPrice !== undefined) filters.minPrice = minPrice;
    if (maxPrice !== undefined) filters.maxPrice = maxPrice;

    return this.menuService.getAllItems(filters);
  }

  @Get('items/popular')
  @Public()
  async getPopularItems(@Query('limit') limit: string = '10') {
    return this.menuService.getPopularItems(parseInt(limit));
  }

  @Get('items/:id')
  @Public()
  async getItemById(@Param('id') id: string) {
    return this.menuService.getItemById(id);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async createItem(@Body() dto: CreateMenuItemDto) {
    return this.menuService.createItem(dto);
  }

  @Put('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async deleteItem(@Param('id') id: string) {
    return this.menuService.deleteItem(id);
  }
}
