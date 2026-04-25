"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsRutConstraint = void 0;
exports.IsRut = IsRut;
const class_validator_1 = require("class-validator");
const shared_1 = require("@nexopos/shared");
let IsRutConstraint = class IsRutConstraint {
    validate(value, args) {
        if (typeof value !== 'string')
            return false;
        return (0, shared_1.validateRut)(value);
    }
    defaultMessage(args) {
        return 'El RUT ingresado no es válido';
    }
};
exports.IsRutConstraint = IsRutConstraint;
exports.IsRutConstraint = IsRutConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isRut', async: false })
], IsRutConstraint);
function IsRut(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsRutConstraint,
        });
    };
}
//# sourceMappingURL=is-rut.decorator.js.map