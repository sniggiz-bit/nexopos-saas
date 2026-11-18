import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export so AuthModule can use it if needed
})
export class UsersModule {}
