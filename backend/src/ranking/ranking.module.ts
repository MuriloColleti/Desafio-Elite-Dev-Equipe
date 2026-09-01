import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';

@Module({
  imports: [PrismaModule],
  controllers: [RankingController],
  providers: [RankingService],
})
export class RankingModule {}