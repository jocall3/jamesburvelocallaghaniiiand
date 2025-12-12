// packages/services/embedded-finance/src/index.ts

import { EmbeddedFinanceService } from './embedded-finance.service';
import { EmbeddedFinanceController } from './embedded-finance.controller';
import { EmbeddedFinanceModule } from './embedded-finance.module';
import { EmbeddedFinanceOptions, EmbeddedFinanceAsyncOptions, EmbeddedFinanceOptionsFactory } from './embedded-finance.options';

export {
  EmbeddedFinanceService,
  EmbeddedFinanceController,
  EmbeddedFinanceModule,
  EmbeddedFinanceOptions,
  EmbeddedFinanceAsyncOptions,
  EmbeddedFinanceOptionsFactory,
};

export * from './interfaces';
export * from './dtos';
export * from './entities';