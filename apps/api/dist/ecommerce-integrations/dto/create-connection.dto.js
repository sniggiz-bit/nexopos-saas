"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateConnectionDto = exports.EcommercePlatformDto = void 0;
const class_validator_1 = require("class-validator");
var EcommercePlatformDto;
(function (EcommercePlatformDto) {
    EcommercePlatformDto["SHOPIFY"] = "SHOPIFY";
    EcommercePlatformDto["WOOCOMMERCE"] = "WOOCOMMERCE";
})(EcommercePlatformDto || (exports.EcommercePlatformDto = EcommercePlatformDto = {}));
class CreateConnectionDto {
    platform;
    name;
    shopDomain;
    accessToken;
    locationId;
    siteUrl;
    consumerKey;
    consumerSecret;
    syncProducts;
    syncInventory;
    syncOrders;
    syncCustomers;
    autoCreateSale;
}
exports.CreateConnectionDto = CreateConnectionDto;
__decorate([
    (0, class_validator_1.IsEnum)(EcommercePlatformDto),
    __metadata("design:type", String)
], CreateConnectionDto.prototype, "platform", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateConnectionDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.platform === EcommercePlatformDto.SHOPIFY),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateConnectionDto.prototype, "shopDomain", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.platform === EcommercePlatformDto.SHOPIFY),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateConnectionDto.prototype, "accessToken", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConnectionDto.prototype, "locationId", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.platform === EcommercePlatformDto.WOOCOMMERCE),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateConnectionDto.prototype, "siteUrl", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.platform === EcommercePlatformDto.WOOCOMMERCE),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateConnectionDto.prototype, "consumerKey", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.platform === EcommercePlatformDto.WOOCOMMERCE),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateConnectionDto.prototype, "consumerSecret", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateConnectionDto.prototype, "syncProducts", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateConnectionDto.prototype, "syncInventory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateConnectionDto.prototype, "syncOrders", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateConnectionDto.prototype, "syncCustomers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateConnectionDto.prototype, "autoCreateSale", void 0);
//# sourceMappingURL=create-connection.dto.js.map