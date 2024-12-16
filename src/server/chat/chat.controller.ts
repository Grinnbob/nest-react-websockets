import {
  BadRequestException,
  Controller,
  Body,
  Post,
  Injectable,
  Scope,
} from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller()
@Injectable({ scope: Scope.REQUEST })
export class ChatController {
  constructor(private chatService: ChatService) {}
}
