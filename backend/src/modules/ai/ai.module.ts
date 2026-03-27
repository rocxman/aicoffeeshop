import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [PrismaModule, OrderModule],
  providers: [AIService],
  controllers: [AIController],
  exports: [AIService],
})
export class AIModule {}
