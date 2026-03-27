import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrderModule } from './modules/order/order.module';
import { AIModule } from './modules/ai/ai.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { PaymentModule } from './modules/payment/payment.module';
import { TableModule } from './modules/table/table.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Core Modules
    PrismaModule,
    AuthModule,
    MenuModule,
    OrderModule,
    AIModule,
    WhatsAppModule,
    PaymentModule,
    TableModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
