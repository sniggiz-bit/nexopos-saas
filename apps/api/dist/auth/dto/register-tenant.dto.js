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
exports.RegisterTenantDto = void 0;
const class_validator_1 = require("class-validator");
const is_rut_decorator_1 = require("../../common/decorators/is-rut.decorator");
class RegisterTenantDto {
    companyName;
    userName;
    email;
    phone;
    password;
    rut;
    giro;
    address;
}
exports.RegisterTenantDto = RegisterTenantDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre de la empresa es requerido' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTenantDto.prototype, "companyName", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Tu nombre es requerido' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTenantDto.prototype, "userName", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El email es requerido' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email inválido' }),
    __metadata("design:type", String)
], RegisterTenantDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El teléfono es requerido' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTenantDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña es requerida' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    __metadata("design:type", String)
], RegisterTenantDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, is_rut_decorator_1.IsRut)({ message: 'RUT inválido' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTenantDto.prototype, "rut", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTenantDto.prototype, "giro", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterTenantDto.prototype, "address", void 0);
//# sourceMappingURL=register-tenant.dto.js.map