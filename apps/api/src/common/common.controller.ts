import { Controller, Get, Param, BadRequestException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LiorenService } from '../dte/lioren.service';
import { validateRut } from '@nexopos/shared';
import { Public } from '../auth/decorators/public.decorator';
import { RegistrationRutService } from './registration-rut.service';
import { CurrentUser } from '../auth/user.decorator';

@ApiTags('común')
@Controller('common')
export class CommonController {
    constructor(private readonly liorenService: LiorenService, private readonly registrationRut: RegistrationRutService) { }

    @Public()
    @Get('registration-rut-lookup/:rut')
    lookupRegistrationRut(@Param('rut') rut: string, @Req() request: { ip?: string; socket?: { remoteAddress?: string } }) {
        return this.registrationRut.lookup(rut, request.ip || request.socket?.remoteAddress || 'unknown');
    }

    @ApiOperation({
        summary: 'Consultar RUT Chileno',
        description: 'Busca los datos de una empresa o persona asociados a un RUT.'
    })
    @ApiResponse({ status: 200, description: 'Datos recuperados exitosamente.' })
    @ApiResponse({ status: 400, description: 'RUT inválido.' })
    @Get('rut-lookup/:rut')
    async lookupRut(
        @Param('rut') rut: string,
        @CurrentUser() user: any,
    ) {
        if (!validateRut(rut)) {
            throw new BadRequestException('El RUT no es válido');
        }

        return this.liorenService.consultaRut(rut, user.tenantId);
    }
}
