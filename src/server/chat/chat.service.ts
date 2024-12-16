import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserService } from '../user/user.service';
import { Queue } from '../entities/queue.entity';
import { RoomService } from '../room/room.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  private queues: Queue[] = [];

  constructor(
    private userService: UserService,
    private roomService: RoomService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  async joinRoom(
    userId: string,
    email: string,
    userName: string,
    roomName: string,
    membersCount: number,
    socketId: string,
  ): Promise<{ roomName?: string; message?: string }> {
    console.log(`[joinRoom] Starting joinRoom process for user: ${userId}`);

    // Step 1: Ensure the user exists or create a new one
    console.log(`[joinRoom] Checking if user exists: ${userId}`);
    let user = await this.userService.getUserById(userId);
    if (user === 'Not Exists') {
      console.log(`[joinRoom] User does not exist. Creating user: ${userId}`);
      user = await this.userService.addUser({
        userId,
        email,
        userName,
        socketId,
      });
    } else {
      console.log(
        `[joinRoom] User found. Updating socket ID for user: ${userId}`,
      );
      user.socketId = socketId;
    }

    // Step 2: Check if the user is already in a queue
    console.log(`[joinRoom] Checking if user is already in a queue: ${userId}`);
    const existingQueue = await this.findUserInQueue(user.userId);
    if (existingQueue !== 'Not Exists') {
      console.log(`[joinRoom] User is already in a queue: ${userId}`);
      return {
        message: 'You are already in the queue. Please wait to be matched.',
      };
    }

    // Step 3: Try to find an existing queue with the same requestedMembers
    console.log(`[joinRoom] Retrieving all available queues`);
    const availableQueues = await this.getAllQueues();
    console.log(`[joinRoom] Found ${availableQueues.length} queues`);
    let suitableQueue = availableQueues.find(
      (queue) =>
        queue.membersNumber == membersCount &&
        queue.userIds.length < membersCount,
    );

    if (suitableQueue) {
      console.log(`[joinRoom] Suitable queue found. Adding user to queue.`);
      await this.addUserToQueue(user, membersCount, socketId);

      // Check if the queue is now full
      if (suitableQueue.userIds.length == membersCount) {
        console.log(`[joinRoom] Queue is full.`);

        for (const participantId of suitableQueue.userIds) {
          const participant = await this.userService.getUserById(participantId);
          if (participant !== 'Not Exists') {
            console.log(
              `[joinRoom] Adding user ${participantId} to room: ${roomName}`,
            );
            await this.roomService.addUserToRoom(roomName, participant.userId);

            console.log(
              `[joinRoom] Notifying user ${participantId} to join room: ${roomName} by socketId: ${participant.socketId}`,
            );
            await this.chatGateway.joinRoom(participant.socketId, roomName);
          }
        }

        console.log(`[joinRoom] Removing queue:`, suitableQueue);
        this.deleteQueue(suitableQueue);
        return { roomName };
      }

      console.log(
        `[joinRoom] User added to queue. Waiting for more participants.`,
      );
      return {
        message: 'You have joined the queue. Waiting for more participants.',
      };
    }

    // Step 4: If no suitable queue exists, create a new queue
    console.log(`[joinRoom] No suitable queue found. Creating a new queue.`);
    await this.addUserToQueue(user, membersCount, socketId);
    console.log(`[joinRoom] User added to a new queue: ${userId}`);
    return {
      message:
        'You have been added to a new queue. Waiting for more participants.',
    };
  }

  async addUserToQueue(
    user: User,
    membersNumber: number,
    socketId: string,
  ): Promise<Queue> {
    // Find an existing queue with the same membersNumber
    const existingQueue = this.queues.find(
      (queue) =>
        queue.membersNumber == membersNumber &&
        queue.userIds.length < membersNumber,
    );

    if (existingQueue) {
      // Add the user to the existing queue
      existingQueue.userIds.push(user.userId);
      return existingQueue;
    }

    // Create a new queue if no suitable one exists
    const newQueue = new Queue({
      userIds: [user.userId],
      membersNumber,
      socketId,
    });

    this.queues.push(newQueue);
    return newQueue;
  }

  async findUserInQueue(userId: string): Promise<Queue | 'Not Exists'> {
    for (const queue of this.queues) {
      if (queue.userIds.includes(userId)) {
        return queue;
      }
    }
    return 'Not Exists';
  }

  async removeUserFromQueue(userId: string): Promise<void> {
    for (const queue of this.queues) {
      const userIndex = queue.userIds.indexOf(userId);
      if (userIndex !== -1) {
        queue.userIds.splice(userIndex, 1);

        // If the queue is empty after removing the user, delete it
        if (queue.userIds.length === 0) {
          this.deleteQueue(queue);
        }
        return;
      }
    }
    throw new Error('User not found in any queue');
  }

  async deleteQueue(queue: Queue): Promise<void> {
    const queueIndex = this.queues.indexOf(queue);
    this.queues.splice(queueIndex, 1);
  }

  async getAllQueues(): Promise<Queue[]> {
    return this.queues;
  }
}
