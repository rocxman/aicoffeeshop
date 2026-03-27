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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto, UpdateTableDto, ScanQRDto } from './dto/table.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/guards/roles.guard';

@Controller('tables')
export class TableController {
  constructor(private tableService: TableService) {}

  /**
   * Create a new table (Admin only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async createTable(@Body() dto: CreateTableDto) {
    return this.tableService.createTable(dto);
  }

  /**
   * Create multiple tables in batch (Admin only)
   */
  @Post('batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async createTables(@Body() tables: CreateTableDto[]) {
    return this.tableService.createTables(tables);
  }

  /**
   * Get all tables
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getTables(
    @Query('zone') zone?: string,
    @Query('status') status?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {};
    if (zone) filters.zone = zone;
    if (status) filters.status = status;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    return this.tableService.getTables(filters);
  }

  /**
   * Get table by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getTableById(@Param('id') id: string) {
    return this.tableService.getTableById(id);
  }

  /**
   * Get table by number
   */
  @Get('number/:number')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async getTableByNumber(@Param('number') number: string) {
    return this.tableService.getTableByNumber(number);
  }

  /**
   * Update table (Admin only)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateTable(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.tableService.updateTable(id, dto);
  }

  /**
   * Delete table (soft delete) (Admin only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async deleteTable(@Param('id') id: string) {
    return this.tableService.deleteTable(id);
  }

  /**
   * Generate QR code for a table (Admin only)
   */
  @Post(':id/qr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async generateQRCode(
    @Param('id') id: string,
    @Query('baseUrl') baseUrl?: string,
  ) {
    const qrCodePath = await this.tableService.generateQRCode(id, baseUrl);

    return {
      success: true,
      qrCodePath,
      message: 'QR code generated successfully',
    };
  }

  /**
   * Generate QR codes for all tables (Admin only)
   */
  @Post('qr/generate-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async generateAllQRCodes(@Query('baseUrl') baseUrl?: string) {
    const count = await this.tableService.generateAllQRCodes(baseUrl);

    return {
      success: true,
      count,
      message: `Generated ${count} QR codes`,
    };
  }

  /**
   * Scan QR code (Public - for customers)
   */
  @Post('scan')
  @Public()
  @HttpCode(HttpStatus.OK)
  async scanQR(@Body() dto: ScanQRDto) {
    return this.tableService.recordScan(dto);
  }

  /**
   * Get table by QR code (Public)
   */
  @Get('code/:code')
  @Public()
  async getTableByCode(@Param('code') code: string) {
    return this.tableService.getTableByCode(code);
  }

  /**
   * Get table analytics (Admin only)
   */
  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async getTableAnalytics(@Param('id') id: string) {
    return this.tableService.getTableAnalytics(id);
  }

  /**
   * Get all tables analytics (Admin only)
   */
  @Get('analytics/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  async getAllTablesAnalytics() {
    return this.tableService.getAllTablesAnalytics();
  }

  /**
   * Update table status (Staff only)
   */
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.STAFF)
  async updateTableStatus(
    @Param('id') id: string,
    @Body('status') status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE',
  ) {
    return this.tableService.updateTableStatus(id, status);
  }
}
