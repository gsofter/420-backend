import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LandService } from './land.service';
import { LandController } from './land.controller';
import { UserModule } from 'src/user/user.module';
import { BudModule } from 'src/bud/bud.module';

@Module({
  imports: [PrismaModule, forwardRef(() => UserModule), BudModule],
  providers: [LandService],
  controllers: [LandController],
  exports: [LandService],
})
export class LandModule {}
