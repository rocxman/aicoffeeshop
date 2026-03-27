import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtPayload, AuthUser } from './interfaces/auth.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    const { email, phone, password, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // Create loyalty points for new user
    await this.prisma.loyaltyPoint.create({
      data: {
        userId: user.id,
        points: 0,
        lifetimePoints: 0,
        tier: 'BRONZE',
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email || '', user.role);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto) {
    const { email, phone, password } = loginDto;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    // Find user
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Please login with your credentials first');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email || '', user.role);

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  /**
   * Login with phone (OTP-based, for customers)
   */
  async loginWithPhone(phone: string) {
    let user = await this.prisma.user.findFirst({
      where: { phone },
    });

    if (!user) {
      // Create new user with phone only
      user = await this.prisma.user.create({
        data: {
          phone,
          role: 'CUSTOMER',
        },
      });

      // Create loyalty points
      await this.prisma.loyaltyPoint.create({
        data: {
          userId: user.id,
          points: 50, // Welcome bonus
          lifetimePoints: 50,
          tier: 'BRONZE',
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email || '', user.role);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.generateTokens(user.id, user.email || '', user.role);

    return tokens;
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(userId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        loyaltyPoints: true,
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as any, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '7d') as any,
      }),
      this.jwtService.signAsync(payload as any, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '30d') as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compare password
   */
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
