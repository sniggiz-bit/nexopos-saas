import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { validateRut } from '@nexopos/shared';

@ValidatorConstraint({ name: 'isRut', async: false })
export class IsRutConstraint implements ValidatorConstraintInterface {
    validate(value: any, _args: ValidationArguments) {
        if (typeof value !== 'string') return false;
        return validateRut(value);
    }

    defaultMessage(_args: ValidationArguments) {
        return 'El RUT ingresado no es válido';
    }
}

export function IsRut(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsRutConstraint,
        });
    };
}
