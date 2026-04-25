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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const lioren_service_1 = require("../dte/lioren.service");
const shared_1 = require("@nexopos/shared");
let CommonController = class CommonController {
    liorenService;
    constructor(liorenService) {
        this.liorenService = liorenService;
    }
    async lookupRut(rut) {
        if (!(0, shared_1.validateRut)(rut)) {
            throw new common_1.BadRequestException('El RUT no es válido');
        }
        return this.liorenService.consultaRut(rut);
    }
};
exports.CommonController = CommonController;
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: 'Consultar RUT Chileno',
        description: 'Boya los datos de una empresa o persona asociados a un RUT.'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Datos recuperados exitosamente.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'RUT inválido.' }),
    (0, common_1.Get)('rut-lookup/:rut'),
    __param(0, (0, common_1.Param)('rut')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CommonController.prototype, "lookupRut", null);
exports.CommonController = CommonController = __decorate([
    (0, swagger_1.ApiTags)('común'),
    (0, common_1.Controller)('common'),
    __metadata("design:paramtypes", [lioren_service_1.LiorenService])
], CommonController);
//# sourceMappingURL=common.controller.js.map