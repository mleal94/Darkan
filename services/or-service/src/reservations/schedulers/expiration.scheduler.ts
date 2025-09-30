import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument } from '../schemas/reservation.schema';
import { ReservationStatus } from '../../common/types/reservation.types';
import { OutboxService } from '../../outbox/outbox.service';

@Injectable()
export class ExpirationScheduler {
  private readonly logger = new Logger(ExpirationScheduler.name);

  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    private outboxService: OutboxService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async markExpiredReservations(): Promise<void> {
    try {
      const now = new Date();
      
      // Buscar reservas PENDING que han expirado (más de 15 minutos sin confirmar)
      const expiredReservations = await this.reservationModel.find({
        status: ReservationStatus.PENDING,
        createdAt: { $lt: new Date(now.getTime() - 15 * 60 * 1000) }, // 15 minutos
      }).exec();

      if (expiredReservations.length > 0) {
        this.logger.log(`Found ${expiredReservations.length} expired reservations`);

        for (const reservation of expiredReservations) {
          // Marcar como expirada
          reservation.status = ReservationStatus.EXPIRED;
          reservation.version += 1;
          await reservation.save();

          // Crear evento en Outbox
          await this.outboxService.createOutboxEvent(
            'reservation.expired',
            reservation._id.toString(),
            'reservation',
            {
              reservationId: reservation._id.toString(),
              operatingRoomId: reservation.operatingRoomId,
              surgeonId: reservation.surgeonId,
              startTime: reservation.startTime,
              endTime: reservation.endTime,
              status: reservation.status,
              type: reservation.type,
              description: reservation.description,
              expiredAt: now,
            },
          );

          this.logger.log(`Reservation ${reservation._id} marked as expired`);
        }
      }
    } catch (error) {
      this.logger.error('Error marking expired reservations:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldExpiredReservations(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await this.reservationModel.deleteMany({
        status: ReservationStatus.EXPIRED,
        updatedAt: { $lt: thirtyDaysAgo },
      }).exec();

      if (result.deletedCount > 0) {
        this.logger.log(`Cleaned up ${result.deletedCount} old expired reservations`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up old expired reservations:', error);
    }
  }
}
