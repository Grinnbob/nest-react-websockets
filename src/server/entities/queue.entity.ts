import {
  SocketId,
  UserId,
  Queue as QueueType,
} from '../../shared/interfaces/chat.interface';

export class Queue implements QueueType {
  constructor(attrs: QueueType) {
    Object.assign(this, attrs);
  }
  userIds: UserId[];
  socketId: SocketId;
  membersNumber: number;
}
