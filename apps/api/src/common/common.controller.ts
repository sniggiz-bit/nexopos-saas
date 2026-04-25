import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LiorenService } from '../dte/lioren.service';
import { validateRut } from '@nexopos/shared';

@ApiTags('común')
@Controller('common')
export class CommonController {
    constructor(private readonly liorenService: LiorenService) { }

    @ApiOperation({
        summary: 'Consultar RUT Chileno',
        description: 'Boya los datos de una empresa o persona asociados a un RUT.'
    })
    @ApiResponse({ status: 200, description: 'Datos recuperados exitosamente.' })
    @ApiResponse({ status: 400, description: 'RUT inválido.' })
    @Get('rut-lookup/:rut')
    async lookupRut(@Param('rut') rut: string) {
        if (!validateRut(rut)) {
            throw new BadRequestException('El RUT no es válido');
        }

        return this.liorenService.consultaRut(rut);
    }
}
