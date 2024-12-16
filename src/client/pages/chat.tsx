import React, { useState, useEffect } from 'react';
import { MakeGenerics, useMatch, useNavigate } from '@tanstack/react-location';
import { io, Socket } from 'socket.io-client';
import {
  User,
  Message,
  ServerToClientEvents,
  ClientToServerEvents,
  KickUser,
  JoinRoom,
  Room,
} from '../../shared/interfaces/chat.interface';
import { Header } from '../components/header';
import { UserList } from '../components/list';
import { MessageForm } from '../components/message.form';
import { Messages, ClientMessage } from '../components/messages';
import { ChatLayout } from '../layouts/chat.layout';
import { unsetRoom, useRoomQuery, useUserRoomQuery } from '../lib/room';
import { getUser } from '../lib/user';
import {
  ChatMessageSchema,
  JoinRoomSchema,
  KickUserSchema,
} from '../../shared/schemas/chat.schema';
import { LoadingLayout } from '../layouts/loading.layout';
import { Loading } from '../components/loading';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false,
});

function Chat() {
  const {
    data: { user, roomName, membersNumber },
  } = useMatch<ChatLocationGenerics>();

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isJoinedRoom, setIsJoinedRoom] = useState(false);
  const [isJoiningDelay, setIsJoiningDelay] = useState(false);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [toggleUserList, setToggleUserList] = useState(false);
  const [roomNameResult, setRoomNameResult] = useState<string | null>(null);
  const { data: room, refetch: roomRefetch } = useRoomQuery(
    roomNameResult,
    isConnected,
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !membersNumber || !roomName) {
      navigate({ to: '/', replace: true });
    } else {
      socket.on('connect', () => {
        setIsJoiningDelay(true);
        const joinRoom: JoinRoom = {
          roomName: roomName,
          membersNumber,
          user: { socketId: socket.id, ...user },
          eventName: 'join_room',
        };
        JoinRoomSchema.parse(joinRoom);
        setTimeout(() => {
          // default required 800 ms minimum join delay to prevent flickering
          setIsJoiningDelay(false);
        }, 800);
        socket
          .timeout(30000)
          .emit('join_room', joinRoom as any, (err, response) => {
            if (err) {
              leaveRoom();
            }
            if (response) {
              // setIsJoinedRoom(true);
            }
          });
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('chat', (e) => {
        if (e.user.userId !== user.userId) {
          setMessages((messages) => [{ ...e, delivered: true }, ...messages]);
        }
      });

      socket.on('kick_user', (e) => {
        if (e.userToKick.socketId === socket.id) {
          leaveRoom();
        }
      });

      socket.on('room_name', (data: any) => {
        console.log('--here--', data);

        if (data?.roomName) {
          setRoomNameResult(data.roomName);
          setIsJoinedRoom(true);
          roomRefetch();
        }
      });

      socket.connect();
    }
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('chat');
      socket.off('kick_user');
      socket.off('room_name');
    };
  }, []);

  const leaveRoom = () => {
    socket.disconnect();
    unsetRoom();
    navigate({ to: '/', replace: true });
  };

  const sendMessage = (message: string) => {
    if (user && socket && roomNameResult) {
      const chatMessage: Message = {
        user: {
          userId: user.userId,
          userName: user.userName,
          email: user.email,
          socketId: socket.id,
        },
        timeSent: Date.now(),
        message,
        roomName: roomNameResult,
        eventName: 'chat',
      };
      ChatMessageSchema.parse(chatMessage);
      setMessages((messages) => [
        { ...chatMessage, delivered: false },
        ...messages,
      ]);
      socket.emit('chat', chatMessage, (response) => {
        if (response) {
          setMessages((messages) => {
            const previousMessageIndex = messages.findIndex((mes) => {
              if (
                mes.user.userId === user.userId &&
                mes.timeSent === chatMessage.timeSent
              ) {
                return mes;
              }
            });
            if (previousMessageIndex === -1) {
              throw new Error('[Chat] Previously sent message not found.');
            }
            messages[previousMessageIndex] = {
              ...messages[previousMessageIndex],
              delivered: true,
            };
            return [...messages];
          });
        }
      });
    }
  };

  const kickUser = (userToKick: User) => {
    if (!roomNameResult) {
      throw new Error('[Chat] No room name available.');
    }
    if (!user) {
      throw new Error('[Chat] No current user available.');
    }
    const kickUserData: KickUser = {
      user: { ...user, socketId: socket.id },
      userToKick,
      roomName: roomNameResult,
      eventName: 'kick_user',
    };
    KickUserSchema.parse(kickUserData);
    socket.emit('kick_user', kickUserData, (response) => {
      if (response) {
        console.log('[Chat] User kicked successfully.');
        roomRefetch();
      }
    });
  };

  return (
    <>
      {user?.userId &&
      room &&
      roomNameResult &&
      isJoinedRoom &&
      !isJoiningDelay ? (
        <ChatLayout>
          <Header
            isConnected={isConnected}
            users={room.users ?? []}
            roomName={roomNameResult}
            handleUsersClick={() =>
              setToggleUserList((toggleUserList) => !toggleUserList)
            }
            handleLeaveRoom={leaveRoom}
          />
          {toggleUserList ? (
            <UserList
              room={room}
              currentUser={{ socketId: socket.id, ...user }}
              kickHandler={kickUser}
            />
          ) : (
            <Messages user={user} messages={messages} />
          )}
          <MessageForm sendMessage={sendMessage} />
        </ChatLayout>
      ) : (
        <LoadingLayout>
          <Loading
            message={`Joining ${
              roomNameResult || roomName || 'room'
            } with ${membersNumber} members...`}
          />
        </LoadingLayout>
      )}
    </>
  );
}

export const loader = async () => {
  const user = getUser();
  return {
    user,
    roomName: sessionStorage.getItem('room'),
    membersNumber: sessionStorage.getItem('membersNumber'),
  };
};

type ChatLocationGenerics = MakeGenerics<{
  LoaderData: {
    user: Pick<User, 'userId' | 'userName' | 'email'>;
    membersNumber: number;
    roomName: Room['name'];
  };
}>;

export default Chat;
