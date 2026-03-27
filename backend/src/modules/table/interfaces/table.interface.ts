export interface Table {
  id: string;
  number: string;
  code: string;
  qrCodePath: string | null;
  capacity: number;
  zone: string | null;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QRScan {
  id: string;
  tableId: string;
  sessionId: string | null;
  userId: string | null;
  deviceType: string | null;
  browser: string | null;
  ipAddress: string | null;
  scannedAt: Date;
  converted: boolean;
  orderId: string | null;
}

export interface QRCodeGenerationOptions {
  width?: number;
  margin?: number;
  color?: {
    dark: string;
    light: string;
  };
}

export interface TableAnalytics {
  tableId: string;
  tableNumber: string;
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  scansThisMonth: number;
  conversionRate: number;
  totalOrders: number;
  peakHours: Array<{ hour: number; scans: number }>;
}
