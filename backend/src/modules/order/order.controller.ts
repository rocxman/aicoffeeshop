import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/guards/roles.guard';

@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  /**
   * Create new order
   */
  @Post()
  @Public() // Allow guest orders
  async createOrder(@Body() dto: CreateOrderDto, @Request() req: any) {
    // Attach user ID if authenticated
    if (req.user) {
      dto.userId = req.user.id;
      
      // Auto-fill customer info from user profile if not provided
      if (!dto.customerName) dto.customerName = req.user.name;
      if (!dto.customerPhone) dto.customerPhone = req.user.phone;
    }

    return this.orderService.createOrder(dto);
  }

  /**
   * Get current user's orders
   */
  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  async getMyOrders(@Request() req: any, @Query('limit') limit: string = '20') {
    return this.orderService.getUserOrders(req.user.id, parseInt(limit));
  }

  /**
   * Get order by ID
   */
  @Get(':id')
  @Public()
  async getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  /**
   * Get order by order number
   */
  @Get('number/:orderNumber')
  @Public()
  async getOrderByNumber(@Param('orderNumber') orderNumber: string) {
    return this.orderService.getOrderByNumber(orderNumber);
  }

  /**
   * Get all orders (admin only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getAllOrders(
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (channel) filters.channel = channel;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit);

    return this.orderService.getAllOrders(filters);
  }

  /**
   * Update order status (staff only)
   */
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(id, dto);
  }

  /**
   * Cancel order
   */
  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async cancelOrder(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.orderService.cancelOrder(id, reason);
  }

  /**
   * Get order statistics (admin only)
   */
  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async getOrderStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.orderService.getOrderStats(filters.startDate, filters.endDate);
  }
}
