import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from './dto/menu.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CATEGORY OPERATIONS
  // ============================================

  /**
   * Get all menu categories with items
   */
  async getAllCategories(includeItems: boolean = true) {
    return this.prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: includeItems
        ? {
            items: {
              where: { isActive: true },
              orderBy: { name: 'asc' },
            },
          }
        : undefined,
    });
  }

  /**
   * Get single category by ID
   */
  async getCategoryById(id: string) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
      include: {
        items: {
          where: { isActive: true },
          include: {
            options: {
              include: {
                values: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Create new category
   */
  async createCategory(dto: CreateMenuCategoryDto) {
    return this.prisma.menuCategory.create({
      data: dto,
    });
  }

  /**
   * Update category
   */
  async updateCategory(id: string, dto: UpdateMenuCategoryDto) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.menuCategory.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(id: string) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.menuCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============================================
  // MENU ITEM OPERATIONS
  // ============================================

  /**
   * Get all menu items
   */
  async getAllItems(filters?: {
    categoryId?: string;
    isPopular?: boolean;
    isFeatured?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const where: any = { isActive: true };

    if (filters) {
      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }
      if (filters.isPopular !== undefined) {
        where.isPopular = filters.isPopular;
      }
      if (filters.isFeatured !== undefined) {
        where.isFeatured = filters.isFeatured;
      }
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = {};
        if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
        if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
      }
    }

    return this.prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        options: {
          include: {
            values: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get single menu item by ID
   */
  async getItemById(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        options: {
          include: {
            values: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return item;
  }

  /**
   * Get menu items by category
   */
  async getItemsByCategory(categoryId: string) {
    return this.prisma.menuItem.findMany({
      where: {
        categoryId,
        isActive: true,
      },
      include: {
        category: true,
        options: {
          include: {
            values: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get popular items
   */
  async getPopularItems(limit: number = 10) {
    return this.prisma.menuItem.findMany({
      where: {
        isActive: true,
        isPopular: true,
      },
      include: {
        category: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create new menu item
   */
  async createItem(dto: CreateMenuItemDto) {
    // Verify category exists
    const category = await this.prisma.menuCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Create item with options
    const { options, ...itemData } = dto;

    const item = await this.prisma.menuItem.create({
      data: {
        ...itemData,
        options: options
          ? {
              create: options.map((opt) => ({
                name: opt.name,
                type: opt.type || 'SINGLE',
                required: opt.required || false,
                minSelect: opt.minSelect || 0,
                maxSelect: opt.maxSelect || 1,
                values: opt.values
                  ? {
                      create: opt.values.map((val) => ({
                        value: val.value,
                        priceModifier: val.priceModifier || 0,
                        isDefault: val.isDefault || false,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        options: {
          include: {
            values: true,
          },
        },
      },
    });

    return item;
  }

  /**
   * Update menu item
   */
  async updateItem(id: string, dto: UpdateMenuItemDto) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: dto,
      include: {
        category: true,
        options: {
          include: {
            values: true,
          },
        },
      },
    });
  }

  /**
   * Delete menu item (soft delete)
   */
  async deleteItem(id: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============================================
  // MENU OPTION OPERATIONS
  // ============================================

  /**
   * Add option to menu item
   */
  async addOption(itemId: string, name: string, type: 'SINGLE' | 'MULTIPLE' = 'SINGLE') {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuOption.create({
      data: {
        itemId,
        name,
        type,
      },
      include: {
        values: true,
      },
    });
  }

  /**
   * Add option value
   */
  async addOptionValue(
    optionId: string,
    value: string,
    priceModifier: number = 0,
    isDefault: boolean = false,
  ) {
    const option = await this.prisma.menuOption.findUnique({
      where: { id: optionId },
    });

    if (!option) {
      throw new NotFoundException('Option not found');
    }

    return this.prisma.menuOptionValue.create({
      data: {
        optionId,
        value,
        priceModifier,
        isDefault,
      },
    });
  }

  /**
   * Delete option
   */
  async deleteOption(optionId: string) {
    const option = await this.prisma.menuOption.findUnique({
      where: { id: optionId },
    });

    if (!option) {
      throw new NotFoundException('Option not found');
    }

    return this.prisma.menuOption.delete({
      where: { id: optionId },
    });
  }
}
