"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiorenHelper = void 0;
const create_sale_dto_1 = require("../sales/dto/create-sale.dto");
class LiorenHelper {
    static mapPaymentMethod(method) {
        switch (method) {
            case create_sale_dto_1.PaymentMethod.EFECTIVO:
                return { formapago: 1, mediopago: 'EF' };
            case create_sale_dto_1.PaymentMethod.DEBITO:
                return { formapago: 1, mediopago: 'DB' };
            case create_sale_dto_1.PaymentMethod.CREDITO:
                return { formapago: 1, mediopago: 'CR' };
            case create_sale_dto_1.PaymentMethod.TRANSFERENCIA:
                return { formapago: 1, mediopago: 'TR' };
            default:
                return { formapago: 1, mediopago: 'EF' };
        }
    }
    static getTaxBreakdown(totalBruto) {
        const factorIVA = 1.19;
        const neto = Math.round(totalBruto / factorIVA);
        const iva = totalBruto - neto;
        return { neto, iva, bruto: totalBruto };
    }
}
exports.LiorenHelper = LiorenHelper;
//# sourceMappingURL=lioren.helper.js.map