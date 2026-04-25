import { ValidationOptions, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
export declare class IsRutConstraint implements ValidatorConstraintInterface {
    validate(value: any, _args: ValidationArguments): boolean;
    defaultMessage(_args: ValidationArguments): string;
}
export declare function IsRut(validationOptions?: ValidationOptions): (object: object, propertyName: string) => void;
