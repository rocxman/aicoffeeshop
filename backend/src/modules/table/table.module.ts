import { Module } from '@nestjs/common';
import { TableService } from './table.service';
import { TableController } from './table.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TableService],
  controllers: [TableController],
  exports: [TableService],
})
export class TableModule {}
