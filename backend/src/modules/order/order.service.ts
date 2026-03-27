import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique order number
   * Format: ORD-YYYYMMDD-XXX
   */
  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get today's order count
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const count = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    const sequence = String(count + 1).padStart(3, '0');
    return `ORD-${dateStr}-${sequence}`;
  }

  /**
   * Calculate order pricing
   */
  private async calculateOrderPricing(items: any[], discount: number = 0, promoId?: string) {
    let subtotal = 0;

    for (const item of items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.itemId },
      });

      if (!menuItem) {
        throw new NotFoundException(`Menu item ${item.itemId} not found`);
      }

      if (!menuItem.isActive) {
        throw new BadRequestException(`Menu item ${menuItem.name} is not available`);
      }

      let itemTotal = menuItem.price * item.quantity;

      // Add option prices
      if (item.options && item.options.length > 0) {
        for (const option of item.options) {
          const optionValue = await this.prisma.menuOptionValue.findUnique({
            where: { id: option.optionValueId },
          });

          if (optionValue) {
            itemTotal += optionValue.priceModifier * item.quantity;
          }
        }
      }

      subtotal += itemTotal;
    }

    // Apply discount
    const discountAmount = discount || 0;

    // Calculate tax (10%)
    const tax = Math.round((subtotal - discountAmount) * 0.1);

    // Calculate service fee (5%)
    const serviceFee = Math.round((subtotal - discountAmount) * 0.05);

    // Total
    const totalPrice = subtotal - discountAmount + tax + serviceFee;

    return {
      subtotal,
      discount: discountAmount,
      tax,
      serviceFee,
      totalPrice,
    };
  }

  /**
   * Validate and apply promo code
   */
  private async applyPromoCode(promoCode: string, subtotal: number, channel: string) {
    const promo = await this.prisma.promo.findUnique({
      where: { code: promoCode.toUpperCase() },
    });

    if (!promo) {
      throw new NotFoundException('Invalid promo code');
    }

    if (!promo.isActive) {
      throw new BadRequestException('Promo code is no longer active');
    }

    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      throw new BadRequestException('Promo code is not valid at this time');
    }

    if (subtotal < promo.minPurchase) {
      throw new BadRequestException(`Minimum purchase of Rp ${promo.minPurchase.toLocaleString()} required`);
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      throw new BadRequestException('Promo code has reached usage limit');
    }

    // Check channel applicability
    if (promo.applicableChannels.length > 0 && !promo.applicableChannels.includes(channel as any)) {
      throw new BadRequestException('Promo code is not valid for this channel');
    }

    return promo;
  }

  /**
   * Create new order
   */
  async createOrder(dto: CreateOrderDto) {
    const { userId, channel, items, promoCode, discount, tableNumber, customerName, customerPhone, customerNotes } = dto;

    if (items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Validate items and calculate pricing
    const pricing = await this.calculateOrderPricing(items, discount);

    // Apply promo if provided
    let promoId: string | null = null;
    if (promoCode) {
      const promo = await this.applyPromoCode(promoCode, pricing.subtotal, channel);
      promoId = promo.id;

      // Update promo usage count
      await this.prisma.promo.update({
        where: { id: promo.id },
        data: { usedCount: promo.usedCount + 1 },
      });

      // Recalculate with promo
      if (promo.valueType === 'PERCENTAGE') {
        const promoDiscount = Math.round(pricing.subtotal * (promo.value / 100));
        pricing.discount = Math.min(promoDiscount, promo.maxDiscount || promoDiscount);
      } else {
        pricing.discount = promo.value;
      }

      pricing.totalPrice = pricing.subtotal - pricing.discount + pricing.tax + pricing.serviceFee;
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        userId: userId || null,
        orderNumber,
        status: OrderStatus.PENDING,
        channel: channel as any,
        tableNumber,
        customerName,
        customerPhone,
        customerNotes,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        tax: pricing.tax,
        serviceFee: pricing.serviceFee,
        totalPrice: pricing.totalPrice,
        promoId: promoId || undefined,
        items: {
          create: items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: 0, // Will be set in afterCreate hook or calculated separately
            totalPrice: 0, // Will be calculated
            notes: item.notes,
            options: item.options
              ? {
                  create: item.options.map((opt) => ({
                    optionValueId: opt.optionValueId,
                    priceModifier: opt.priceModifier || 0,
                  })),
                }
              : undefined,
          })),
        },
      },
      include: {
        items: {
          include: {
            item: true,
            options: {
              include: {
                optionValue: true,
              },
            },
          },
        },
        promo: true,
      },
    });

    // Update item prices
    for (const orderItem of order.items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: orderItem.itemId },
      });

      if (menuItem) {
        let itemTotal = menuItem.price * orderItem.quantity;

        // Add option prices
        const itemOptions = orderItem.options || [];
        for (const opt of itemOptions) {
          itemTotal += opt.optionValue.priceModifier * orderItem.quantity;
        }

        await this.prisma.orderItem.update({
          where: { id: orderItem.id },
          data: {
            unitPrice: menuItem.price,
            totalPrice: itemTotal,
          },
        });
      }
    }

    // Fetch updated order
    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            item: true,
            options: {
              include: {
                optionValue: true,
              },
            },
          },
        },
        promo: true,
      },
    });

    return updatedOrder;
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        items: {
          include: {
            item: true,
            options: {
              include: {
                optionValue: true,
              },
            },
          },
        },
        payment: true,
        promo: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            item: true,
            options: {
              include: {
                optionValue: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Get orders by user
   */
  async getUserOrders(userId: string, limit: number = 20) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        items: {
          take: 1, // Just show first item for preview
          include: {
            item: true,
          },
        },
      },
    });
  }

  /**
   * Get all orders (admin)
   */
  async getAllOrders(filters?: {
    status?: OrderStatus;
    channel?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.channel) where.channel = filters.channel;
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      include: {
        items: {
          take: 1,
          include: {
            item: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.getOrderById(id);

    // Status transition validation
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY],
      [OrderStatus.READY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    if (!validTransitions[order.status as OrderStatus].includes(dto.status as OrderStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status as OrderStatus,
        paidAt: dto.status === 'CONFIRMED' ? new Date() : undefined,
        completedAt: dto.status === 'DELIVERED' ? new Date() : undefined,
      },
      include: {
        items: {
          include: {
            item: true,
            options: {
              include: {
                optionValue: true,
              },
            },
          },
        },
      },
    });

    // Award loyalty points when order is completed
    if (dto.status === 'DELIVERED' && order.userId) {
      await this.awardLoyaltyPoints(order.userId, order.totalPrice, order.id);
    }

    return updatedOrder;
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string, reason?: string) {
    const order = await this.getOrderById(id);

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel completed order');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        customerNotes: reason ? `${order.customerNotes || ''}\n[Cancellation: ${reason}]` : order.customerNotes,
      },
    });
  }

  /**
   * Award loyalty points
   */
  private async awardLoyaltyPoints(userId: string, amount: number, orderId: string) {
    const loyaltyPoint = await this.prisma.loyaltyPoint.findUnique({
      where: { userId },
    });

    if (!loyaltyPoint) {
      // Create loyalty record
      await this.prisma.loyaltyPoint.create({
        data: {
          userId,
          points: Math.floor(amount / 1000), // 1 point per Rp 1000
          lifetimePoints: Math.floor(amount / 1000),
          tier: 'BRONZE',
        },
      });
    } else {
      const pointsEarned = Math.floor(amount / 1000);
      
      await this.prisma.loyaltyPoint.update({
        where: { userId },
        data: {
          points: loyaltyPoint.points + pointsEarned,
          lifetimePoints: loyaltyPoint.lifetimePoints + pointsEarned,
        },
      });

      // Create transaction record
      await this.prisma.loyaltyTransaction.create({
        data: {
          loyaltyPointId: loyaltyPoint.id,
          type: 'EARN',
          points: pointsEarned,
          orderId,
          description: `Earned from order ${orderId}`,
        },
      });
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalOrders, totalRevenue, ordersByStatus, ordersByChannel] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.aggregate({
        where,
        _sum: { totalPrice: true },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.order.groupBy({
        by: ['channel'],
        where,
        _count: true,
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      ordersByStatus,
      ordersByChannel,
    };
  }
}
