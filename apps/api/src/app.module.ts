import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DebugController } from './debug/debug.controller';
import { SalesModule } from './sales/sales.module';
import { PrismaModule } from './prisma/prisma.module';
import { DteModule } from './dte/dte.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { DteConfigModule } from './dte-config/dte-config.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { ShiftsModule } from './shifts/shifts.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { QuotesModule } from './quotes/quotes.module';
import { CreditsModule } from './credits/credits.module';
import { InventoryModule } from './inventory/inventory.module';
import { UsersModule } from './users/users.module';
import { TreasuryModule } from './treasury/treasury.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';
import { PlansModule } from './plans/plans.module';
import { TenantsModule } from './tenants/tenants.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { SystemLogsModule } from './system-logs/system-logs.module';
import { BranchesModule } from './branches/branches.module';
import { TransfersModule } from './transfers/transfers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SalesModule,
    PrismaModule,
    DteModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    DteConfigModule,
    ReceiptsModule,
    ShiftsModule,
    AuthModule,
    CustomersModule,
    QuotesModule,
    CreditsModule,
    InventoryModule,
    UsersModule,
    TreasuryModule,
    DashboardModule,
    PlansModule,
    TenantsModule,
    AnnouncementsModule,
    SystemLogsModule,
    BranchesModule,
    TransfersModule,
  ],
  controllers: [AppController, DebugController],
  providers: [AppService],
})
export class AppModule { }
