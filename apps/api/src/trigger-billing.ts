import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BillingService } from './billing/billing.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const billingService = app.get(BillingService);
  
  console.log('Triggering manual billing run...');
  await billingService.handleMonthlyBilling();
  console.log('Done!');
  
  await app.close();
}

bootstrap();
