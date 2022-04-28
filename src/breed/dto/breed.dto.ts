import { ConfigService } from '@nestjs/config';
import {
  BreedBud,
  BreedLevel,
  BreedPair,
  BudColor,
  BudGender,
  BudShine,
} from '@prisma/client';
import { Exclude, Transform } from 'class-transformer';
import { getBonusRateStatus } from 'src/utils/breed';

export class BreedPairDto implements BreedPair {
  id: number;
  maleBudId: number;
  femaleBudId: number;

  @Exclude()
  rate: number;

  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  userAddress: string;
  currentLevel: number;

  levels: BreedLevelDto[];

  constructor(pair: BreedPair & { levels?: BreedLevel[] }, breedTime?: number) {
    this.id = pair.id;
    this.maleBudId = pair.maleBudId;
    this.femaleBudId = pair.femaleBudId;
    this.rate = pair.rate;
    this.createdAt = pair.createdAt;
    this.updatedAt = pair.updatedAt;
    this.userAddress = pair.userAddress;
    this.currentLevel = pair.currentLevel;

    if (pair.levels) {
      this.levels = pair.levels.map(
        (level) => new BreedLevelDto(level, breedTime),
      );
    }
  }
}

export class BreedLevelDto implements BreedLevel {
  id: number;
  pairId: number;
  level: number;
  createdAt: Date;
  endAt: Date;

  @Exclude()
  updatedAt: Date;

  @Transform((v) => getBonusRateStatus(v.value))
  bonusRate: number;

  buds: BreedBudDto[];

  constructor(level: BreedLevel & { buds?: BreedBud[] }, breedTime?: number) {
    this.id = level.id;
    this.pairId = level.pairId;
    this.level = level.level;
    this.createdAt = level.createdAt;
    this.updatedAt = level.updatedAt;

    let isBreedTimeElapsed = false;
    if (breedTime) {
      this.endAt = new Date(level.createdAt.getTime() + breedTime * 1000);
      isBreedTimeElapsed = breedTime && this.endAt.getTime() <= Date.now();
    }

    if (isBreedTimeElapsed) {
      this.bonusRate = level.bonusRate;

      if (level.buds) {
        this.buds = level.buds.map((bud) => new BreedBudDto(bud));
      }
    }
  }
}

export class BreedBudDto implements BreedBud {
  id: number;
  name: string;
  image: string;
  thc: number;
  gen: number;
  budSize: number;
  gender: BudGender;
  shine: BudShine;
  color: BudColor;
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  levelId: number;

  constructor(bud: BreedBud) {
    this.id = bud.id;
    this.name = bud.name;
    this.image = bud.image;
    this.thc = bud.thc;
    this.gen = bud.gen;
    this.budSize = bud.budSize;
    this.gender = bud.gender;
    this.shine = bud.shine;
    this.color = bud.color;
    this.createdAt = bud.createdAt;
    this.updatedAt = bud.updatedAt;
    this.levelId = bud.levelId;
  }
}
