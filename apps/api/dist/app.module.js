"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const ecommerce_integrations_module_1 = require("./ecommerce-integrations/ecommerce-integrations.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const debug_controller_1 = require("./debug/debug.controller");
const sales_module_1 = require("./sales/sales.module");
const prisma_module_1 = require("./prisma/prisma.module");
const dte_module_1 = require("./dte/dte.module");
const products_module_1 = require("./products/products.module");
const categories_module_1 = require("./categories/categories.module");
const brands_module_1 = require("./brands/brands.module");
const dte_config_module_1 = require("./dte-config/dte-config.module");
const receipts_module_1 = require("./receipts/receipts.module");
const shifts_module_1 = require("./shifts/shifts.module");
const auth_module_1 = require("./auth/auth.module");
const customers_module_1 = require("./customers/customers.module");
const quotes_module_1 = require("./quotes/quotes.module");
const credits_module_1 = require("./credits/credits.module");
const inventory_module_1 = require("./inventory/inventory.module");
const users_module_1 = require("./users/users.module");
const treasury_module_1 = require("./treasury/treasury.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const plans_module_1 = require("./plans/plans.module");
const tenants_module_1 = require("./tenants/tenants.module");
const announcements_module_1 = require("./announcements/announcements.module");
const system_logs_module_1 = require("./system-logs/system-logs.module");
const branches_module_1 = require("./branches/branches.module");
const transfers_module_1 = require("./transfers/transfers.module");
const store_module_1 = require("./store/store.module");
const suppliers_module_1 = require("./suppliers/suppliers.module");
const purchases_module_1 = require("./purchases/purchases.module");
const common_module_1 = require("./common/common.module");
const admin_module_1 = require("./admin/admin.module");
const transbank_module_1 = require("./transbank/transbank.module");
const uploads_module_1 = require("./uploads/uploads.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            schedule_1.ScheduleModule.forRoot(),
            ecommerce_integrations_module_1.EcommerceIntegrationsModule,
            sales_module_1.SalesModule,
            prisma_module_1.PrismaModule,
            dte_module_1.DteModule,
            products_module_1.ProductsModule,
            categories_module_1.CategoriesModule,
            brands_module_1.BrandsModule,
            dte_config_module_1.DteConfigModule,
            receipts_module_1.ReceiptsModule,
            shifts_module_1.ShiftsModule,
            auth_module_1.AuthModule,
            customers_module_1.CustomersModule,
            quotes_module_1.QuotesModule,
            credits_module_1.CreditsModule,
            inventory_module_1.InventoryModule,
            users_module_1.UsersModule,
            treasury_module_1.TreasuryModule,
            dashboard_module_1.DashboardModule,
            plans_module_1.PlansModule,
            tenants_module_1.TenantsModule,
            announcements_module_1.AnnouncementsModule,
            system_logs_module_1.SystemLogsModule,
            branches_module_1.BranchesModule,
            transfers_module_1.TransfersModule,
            store_module_1.StoreModule,
            suppliers_module_1.SuppliersModule,
            purchases_module_1.PurchasesModule,
            common_module_1.CommonModule,
            admin_module_1.AdminModule,
            transbank_module_1.TransbankModule,
            uploads_module_1.UploadsModule,
        ],
        controllers: [app_controller_1.AppController, debug_controller_1.DebugController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map