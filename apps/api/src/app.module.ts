import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { EventsModule } from './events/events.module';
import { EcommerceIntegrationsModule } from './ecommerce-integrations/ecommerce-integrations.module';
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
import { PlansModule } from './plans/plans.module';
import { TenantsModule } from './tenants/tenants.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { SystemLogsModule } from './system-logs/system-logs.module';
import { BranchesModule } from './branches/branches.module';
import { TransfersModule } from './transfers/transfers.module';
import { StoreModule } from './store/store.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchasesModule } from './purchases/purchases.module';
import { CommonModule } from './common/common.module';
import { AdminModule } from './admin/admin.module';
import { TransbankModule } from './transbank/transbank.module';
import { UploadsModule } from './uploads/uploads.module';
import { ModulesModule } from './modules/modules.module';
import { BillingModule } from './billing/billing.module';
import { SupportModule } from './support/support.module';
import { MercadopagoModule } from './mercadopago/mercadopago.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    // AuthModule FIRST so JwtModule/JwtService is available globally
    AuthModule,
    PrismaModule,
    EventsModule,
    EcommerceIntegrationsModule,
    SalesModule,
    DteModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    DteConfigModule,
    ReceiptsModule,
    ShiftsModule,
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
    StoreModule,
    SuppliersModule,
    PurchasesModule,
    CommonModule,
    AdminModule,
    TransbankModule,
    UploadsModule,
    ModulesModule,
    BillingModule,
    SupportModule,
    MercadopagoModule,
  ],
  controllers: [AppController, DebugController],
  providers: [
    AppService,
    // Register JwtAuthGuard globally so all controllers use the same
    // JwtService instance configured with the correct JWT_SECRET from AuthModule
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
