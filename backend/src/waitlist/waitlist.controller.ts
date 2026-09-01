import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';
import { WaitlistService } from './waitlist.service';

@Controller()
export class WaitlistController {
constructor(private readonly waitlist: WaitlistService) {}

@Post('sectors/:id/waitlist')
entrar(@Param('id') sectorId: string, @Body() dto: CreateWaitlistEntryDto) {
return this.waitlist.entrar(sectorId, dto);
}

@Get('sectors/:id/waitlist')
listar(@Param('id') sectorId: string) {
return this.waitlist.listar(sectorId);
}

@Delete('waitlist/:id')
sair(@Param('id') id: string) {
return this.waitlist.sair(id);
}
}
