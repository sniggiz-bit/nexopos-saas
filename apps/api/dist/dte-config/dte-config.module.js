"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DteConfigModule = void 0;
const common_1 = require("@nestjs/common");
const dte_config_controller_1 = require("./dte-config.controller");
const dte_config_service_1 = require("./dte-config.service");
const prisma_module_1 = require("../prisma/prisma.module");
let DteConfigModule = class DteConfigModule {
};
exports.DteConfigModule = DteConfigModule;
exports.DteConfigModule = DteConfigModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [dte_config_controller_1.DteConfigController],
        providers: [dte_config_service_1.DteConfigService],
        exports: [dte_config_service_1.DteConfigService],
    })
], DteConfigModule);
//# sourceMappingURL=dte-config.module.js.map