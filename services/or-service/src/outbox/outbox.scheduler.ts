import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxService } from './outbox.service';

@Injectable()
export class OutboxScheduler {
  private readonly logger = new Logger(OutboxScheduler.name);

  constructor(private readonly outboxService: OutboxService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processOutboxEvents(): Promise<void> {
    try {
      this.logger.debug('Processing outbox events...');
      await this.outboxService.processOutboxEvents();
    } catch (error) {
      this.logger.error('Error processing outbox events:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupCompletedEvents(): Promise<void> {
    try {
      this.logger.debug('Cleaning up completed outbox events...');
      await this.outboxService.cleanupCompletedEvents();
    } catch (error) {
      this.logger.error('Error cleaning up completed events:', error);
    }
  }
}
