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
exports.PriceTierDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class PriceTierDto {
    id;
    minQuantity;
    unitPrice;
}
exports.PriceTierDto = PriceTierDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the price tier (optional, for updates)',
        required: false,
    }),
    __metadata("design:type", String)
], PriceTierDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Minimum quantity to trigger this wholesale price',
        example: 6,
        minimum: 2,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2, { message: 'El tramo mínimo de precio mayorista debe ser al menos 2 unidades.' }),
    __metadata("design:type", Number)
], PriceTierDto.prototype, "minQuantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Wholesale unit price in CLP',
        example: 8500,
        minimum: 0,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PriceTierDto.prototype, "unitPrice", void 0);
//# sourceMappingURL=price-tier.dto.js.map