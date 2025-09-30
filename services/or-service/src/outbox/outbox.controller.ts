import { Controller, Get, Post, Param, HttpException, HttpStatus } from '@nestjs/common';
import { OutboxService } from './outbox.service';

@Controller('outbox')
export class OutboxController {
  constructor(private readonly outboxService: OutboxService) {}

  @Get('stats')
  async getOutboxStats() {
    try {
      const stats = await this.outboxService.getOutboxStats();
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        'Error al obtener estadísticas del outbox',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('failed')
  async getFailedEvents() {
    try {
      const failedEvents = await this.outboxService.getFailedEvents();
      return {
        success: true,
        data: failedEvents,
        count: failedEvents.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        'Error al obtener eventos fallidos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('retry/:eventId')
  async retryFailedEvent(@Param('eventId') eventId: string) {
    try {
      await this.outboxService.retryFailedEvent(eventId);
      return {
        success: true,
        message: `Evento ${eventId} programado para reintento`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        'Error al reintentar evento',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('process')
  async processOutboxEvents() {
    try {
      await this.outboxService.processOutboxEvents();
      return {
        success: true,
        message: 'Procesamiento de eventos iniciado',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        'Error al procesar eventos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
