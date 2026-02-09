"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSaleDto = exports.CreateSaleItemDto = void 0;
class CreateSaleItemDto {
    productId;
    quantity;
    price;
}
exports.CreateSaleItemDto = CreateSaleItemDto;
class CreateSaleDto {
    tenantId;
    branchId;
    userId;
    items;
}
exports.CreateSaleDto = CreateSaleDto;
//# sourceMappingURL=create-sale.dto.js.map