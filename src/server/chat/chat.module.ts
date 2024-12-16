import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { RoomModule } from '../room/room.module';
import { UserModule } from '../user/user.module';
import { CaslModule } from '../casl/casl.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [
    RoomModule,
    UserModule,
    CaslModule,
    ThrottlerModule.forRoot({ limit: 5, ttl: 60 }),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, ChatGateway],
})
export class ChatModule {}
