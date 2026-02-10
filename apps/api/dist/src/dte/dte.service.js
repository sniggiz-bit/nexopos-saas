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
exports.DteService = void 0;
const common_1 = require("@nestjs/common");
const lioren_service_1 = require("./lioren.service");
let DteService = class DteService {
    liorenService;
    constructor(liorenService) {
        this.liorenService = liorenService;
    }
    async emitirDte(saleId) {
        return this.liorenService.emitirBoleta(saleId);
    }
};
exports.DteService = DteService;
exports.DteService = DteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [lioren_service_1.LiorenService])
], DteService);
//# sourceMappingURL=dte.service.js.map