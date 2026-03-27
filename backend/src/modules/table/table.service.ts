import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTableDto, UpdateTableDto, ScanQRDto } from './dto/table.dto';
import * as QRCode from 'qrcode';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class TableService {
  private readonly logger = new Logger(TableService.name);
  private qrCodesDir: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Create QR codes directory if not exists
    this.qrCodesDir = join(process.cwd(), 'public', 'qr-codes');
    if (!existsSync(this.qrCodesDir)) {
      mkdirSync(this.qrCodesDir, { recursive: true });
    }
  }

  /**
   * Create a new table
   */
  async createTable(dto: CreateTableDto) {
    // Check if table number already exists
    const existing = await this.prisma.table.findUnique({
      where: { number: dto.number },
    });

    if (existing) {
      throw new ConflictException(`Table ${dto.number} already exists`);
    }

    // Generate unique code for QR
    const code = this.generateTableCode(dto.number);

    // Create table
    const table = await this.prisma.table.create({
      data: {
        number: dto.number,
        code,
        capacity: dto.capacity || 4,
        zone: dto.zone,
        status: dto.status || 'AVAILABLE',
      },
    });

    this.logger.log(`Created table ${table.number} with code ${table.code}`);

    return table;
  }

  /**
   * Create multiple tables in batch
   */
  async createTables(tables: CreateTableDto[]) {
    const results: Array<{ success: boolean; table?: any; error?: string; tableNumber?: string }> = [];

    for (const tableDto of tables) {
      try {
        const table = await this.createTable(tableDto);
        results.push({ success: true, table });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          tableNumber: tableDto.number,
        });
      }
    }

    return results;
  }

  /**
   * Get all tables
   */
  async getTables(filters?: {
    zone?: string;
    status?: string;
    isActive?: boolean;
  }) {
    const where: any = {};

    if (filters) {
      if (filters.zone) where.zone = filters.zone;
      if (filters.status) where.status = filters.status;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
    }

    return this.prisma.table.findMany({
      where,
      orderBy: { number: 'asc' },
      include: {
        _count: {
          select: {
            scans: true,
            orders: true,
          },
        },
      },
    });
  }

  /**
   * Get table by ID
   */
  async getTableById(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        scans: {
          take: 10,
          orderBy: { scannedAt: 'desc' },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return table;
  }

  /**
   * Get table by number
   */
  async getTableByNumber(number: string) {
    const table = await this.prisma.table.findUnique({
      where: { number },
      include: {
        scans: {
          take: 10,
          orderBy: { scannedAt: 'desc' },
        },
      },
    });

    if (!table) {
      throw new NotFoundException(`Table ${number} not found`);
    }

    return table;
  }

  /**
   * Update table
   */
  async updateTable(id: string, dto: UpdateTableDto) {
    const table = await this.prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    // Check if new number conflicts
    if (dto.number && dto.number !== table.number) {
      const existing = await this.prisma.table.findUnique({
        where: { number: dto.number },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Table ${dto.number} already exists`);
      }
    }

    return this.prisma.table.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete table (soft delete by setting isActive = false)
   */
  async deleteTable(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return this.prisma.table.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Generate QR code for a table
   */
  async generateQRCode(tableId: string, baseUrl?: string): Promise<string> {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    // Build QR code URL
    const frontendUrl = baseUrl || this.configService.get('FRONTEND_URL', 'http://localhost:3001');
    const qrUrl = `${frontendUrl}/order?table=${table.code}&sessionId=`;

    // Generate QR code
    const qrCodePath = join(this.qrCodesDir, `table-${table.number}.png`);

    try {
      await QRCode.toFile(qrCodePath, qrUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });

      // Update table with QR code path
      await this.prisma.table.update({
        where: { id: tableId },
        data: { qrCodePath: `qr-codes/table-${table.number}.png` },
      });

      this.logger.log(`Generated QR code for table ${table.number}`);

      return qrCodePath;
    } catch (error) {
      this.logger.error(`Failed to generate QR code: ${error.message}`);
      throw new BadRequestException(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Generate QR codes for all tables
   */
  async generateAllQRCodes(baseUrl?: string): Promise<number> {
    const tables = await this.prisma.table.findMany({
      where: { isActive: true },
    });

    let successCount = 0;

    for (const table of tables) {
      try {
        await this.generateQRCode(table.id, baseUrl);
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to generate QR for table ${table.number}: ${error.message}`);
      }
    }

    this.logger.log(`Generated ${successCount}/${tables.length} QR codes`);

    return successCount;
  }

  /**
   * Record QR scan
   */
  async recordScan(dto: ScanQRDto) {
    // Find table by code
    const table = await this.prisma.table.findUnique({
      where: { code: dto.tableCode },
    });

    if (!table) {
      throw new NotFoundException('Invalid QR code');
    }

    // Check if table is active
    if (!table.isActive) {
      throw new BadRequestException('This table is no longer active');
    }

    // Record scan
    const scan = await this.prisma.qRScan.create({
      data: {
        tableId: table.id,
        sessionId: dto.sessionId,
        userId: dto.userId,
        deviceType: dto.deviceType,
        browser: dto.browser,
        ipAddress: dto.ipAddress,
      },
    });

    // Update table status to occupied if available
    if (table.status === 'AVAILABLE') {
      await this.prisma.table.update({
        where: { id: table.id },
        data: { status: 'OCCUPIED' },
      });
    }

    this.logger.log(`Recorded QR scan for table ${table.number}`);

    return {
      table: {
        id: table.id,
        number: table.number,
        zone: table.zone,
        capacity: table.capacity,
      },
      scan,
    };
  }

  /**
   * Mark scan as converted (led to order)
   */
  async markScanConverted(scanId: string, orderId: string) {
    await this.prisma.qRScan.update({
      where: { id: scanId },
      data: {
        converted: true,
        orderId,
      },
    });

    this.logger.log(`Marked scan ${scanId} as converted with order ${orderId}`);
  }

  /**
   * Get table analytics
   */
  async getTableAnalytics(tableId: string): Promise<any> {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      include: {
        scans: {
          where: {
            scannedAt: {
              gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
        orders: true,
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const scansToday = table.scans.filter((s) => s.scannedAt >= today).length;
    const scansThisWeek = table.scans.filter((s) => s.scannedAt >= weekAgo).length;
    const scansThisMonth = table.scans.filter((s) => s.scannedAt >= monthAgo).length;

    const convertedScans = table.scans.filter((s) => s.converted).length;
    const conversionRate = table.scans.length > 0 ? (convertedScans / table.scans.length) * 100 : 0;

    // Calculate peak hours
    const hourCounts = new Array(24).fill(0);
    table.scans.forEach((scan) => {
      const hour = new Date(scan.scannedAt).getHours();
      hourCounts[hour]++;
    });

    const peakHours = hourCounts
      .map((count, hour) => ({ hour, scans: count }))
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 5);

    return {
      tableId: table.id,
      tableNumber: table.number,
      totalScans: table.scans.length,
      scansToday,
      scansThisWeek,
      scansThisMonth,
      conversionRate: Math.round(conversionRate * 100) / 100,
      totalOrders: table.orders.length,
      peakHours,
    };
  }

  /**
   * Get all tables analytics
   */
  async getAllTablesAnalytics() {
    const tables = await this.prisma.table.findMany({
      where: { isActive: true },
    });

    const analytics: any[] = [];

    for (const table of tables) {
      try {
        const tableAnalytics = await this.getTableAnalytics(table.id);
        analytics.push(tableAnalytics);
      } catch (error) {
        this.logger.error(`Failed to get analytics for table ${table.number}: ${error.message}`);
      }
    }

    return analytics;
  }

  /**
   * Update table status
   */
  async updateTableStatus(id: string, status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE') {
    return this.prisma.table.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Generate unique table code for QR
   */
  private generateTableCode(tableNumber: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TBL-${tableNumber.toUpperCase()}-${timestamp}-${random}`;
  }

  /**
   * Get table by QR code
   */
  async getTableByCode(code: string) {
    const table = await this.prisma.table.findUnique({
      where: { code },
    });

    if (!table) {
      throw new NotFoundException('Invalid QR code');
    }

    return table;
  }
}
