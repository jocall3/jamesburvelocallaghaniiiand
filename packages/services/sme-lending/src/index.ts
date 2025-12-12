import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { LoanApplication } from './entities/LoanApplication';
import { LoanProduct } from './entities/LoanProduct';
import { Lender } from './entities/Lender';
import { LoanApplicationController } from './controllers/LoanApplicationController';
import { LoanProductController } from './controllers/LoanProductController';
import { LenderController } from './controllers/LenderController';
import { LoanApplicationService } from './services/LoanApplicationService';
import { LoanProductService } from './services/LoanProductService';
import { LenderService } from './services/LenderService';
import { getMikroOrmConfig } from './mikro-orm.config';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { createContainer, Lifetime, asClass, asValue } from 'awilix';
import { scopePerRequest, AwilixContext } from 'koa-awilix';
import Router from 'koa-router';

// Initialize Koa
const app = new Koa();

// Configure container
const container = createContainer();

// Register dependencies
container.register({
  loanApplicationController: asClass(LoanApplicationController).scoped(),
  loanProductController: asClass(LoanProductController).scoped(),
  lenderController: asClass(LenderController).scoped(),
  loanApplicationService: asClass(LoanApplicationService).scoped(),
  loanProductService: asClass(LoanProductService).scoped(),
  lenderService: asClass(LenderService).scoped(),
  logger: asValue(logger),
});

// Use middleware
app.use(cors());
app.use(errorHandler);
app.use(bodyParser());
app.use(scopePerRequest(container));

// Main function to start the service
async function main(): Promise<void> {
  try {
    // Initialize MikroORM
    const orm = await MikroORM.init<PostgreSqlDriver>(getMikroOrmConfig());
    const migrator = orm.getMigrator();
    await migrator.up(); // Run migrations

    // Register ORM and entity repositories in the container
    container.register({
      orm: asValue(orm),
      em: asValue(orm.em),
      loanApplicationRepository: asValue(orm.em.getRepository(LoanApplication)),
      loanProductRepository: asValue(orm.em.getRepository(LoanProduct)),
      lenderRepository: asValue(orm.em.getRepository(Lender)),
    });

    // Create a Koa router
    const router = new Router();

    // Define routes using controllers from the container
    router.prefix('/api/v1');

    router.get('/loan-applications', (ctx: AwilixContext) => ctx.state.container.resolve<LoanApplicationController>('loanApplicationController').getAll(ctx));
    router.get('/loan-applications/:id', (ctx: AwilixContext) => ctx.state.container.resolve<LoanApplicationController>('loanApplicationController').getById(ctx));
    router.post('/loan-applications', (ctx: AwilixContext) => ctx.state.container.resolve<LoanApplicationController>('loanApplicationController').create(ctx));
    router.put('/loan-applications/:id', (ctx: AwilixContext) => ctx.state.container.resolve<LoanApplicationController>('loanApplicationController').update(ctx));
    router.delete('/loan-applications/:id', (ctx: AwilixContext) => ctx.state.container.resolve<LoanApplicationController>('loanApplicationController').delete(ctx));

    router.get('/loan-products', (ctx: AwilixContext) => ctx.state.container.resolve<LoanProductController>('loanProductController').getAll(ctx));
    router.get('/loan-products/:id', (ctx: AwilixContext) => ctx.state.container.resolve<LoanProductController>('loanProductController').getById(ctx));
    router.post('/loan-products', (ctx: AwilixContext) => ctx.state.container.resolve<LoanProductController>('loanProductController').create(ctx));
    router.put('/loan-products/:id', (ctx: AwilixContext) => ctx.state.container.resolve<LoanProductController>('loanProductController').update(ctx));
    router.delete('/loan-products/:id', (ctx: AwilixContext) => ctx.state.container.resolve<LoanProductController>('loanProductController').delete(ctx));

    router.get('/lenders', (ctx: AwilixContext) => ctx.state.container.resolve<LenderController>('lenderController').getAll(ctx));
    router.get('/lenders/:id', (ctx: AwilixContext) => ctx.state.container.resolve<LenderController>('lenderController').getById(ctx));
    router.post('/lenders', (ctx: AwilixContext) => ctx.state.container.resolve<LenderController>('lenderController').create(ctx));
    router.put('/lenders/:id', (ctx: AwilixContext) => ctx.state.container.resolve<LenderController>('lenderController').update(ctx));
    router.delete('/lenders/:id', (ctx: AwilixContext) => ctx.state.container.resolve<LenderController>('lenderController').delete(ctx));

    // Use the router middleware
    app.use(router.routes());
    app.use(router.allowedMethods());

    // Start the server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Error starting the service:', error);
    process.exit(1);
  }
}

// Execute the main function
main();