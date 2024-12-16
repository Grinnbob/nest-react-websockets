import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RoomNameSchema,
  UserNameSchema,
  RoomNameSchemaRegex,
  EmailSchema,
  MembersNumberSchema,
} from '../../shared/schemas/chat.schema';
import { generateRoomName, generateUserId, setUser } from '../lib/user';
import { User } from '../../shared/interfaces/chat.interface';

const formSchema = z.object({
  userName: UserNameSchema,
  email: EmailSchema,
  membersNumber: MembersNumberSchema,
  roomName: RoomNameSchema.or(z.string().length(0))
    .optional()
    .transform((name) => (name === '' ? undefined : name)),
});

export type LoginFormInputs = z.infer<typeof formSchema>;

export const LoginForm = ({
  onSubmitSecondary,
  disableNewRoom,
  defaultUser,
}: {
  onSubmitSecondary: (data: LoginFormInputs) => void;
  disableNewRoom: boolean;
  defaultUser?: User['userName'];
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  const onSubmit = (data: LoginFormInputs) => {
    const newUser = {
      userId: generateUserId(data.userName),
      userName: data.userName,
      email: data.email,
    };
    setUser(newUser);
    onSubmitSecondary({ ...data, roomName: generateRoomName() });
  };

  return (
    <div className="h-full w-full py-2 md:px-2 md:py-0">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col justify-center"
      >
        <input
          type="text"
          id="login"
          placeholder="Имя"
          defaultValue={defaultUser && defaultUser}
          required={true}
          minLength={UserNameSchema.minLength ?? undefined}
          maxLength={UserNameSchema.maxLength ?? undefined}
          {...register('userName')}
          className="h-12 rounded-md border border-slate-400 bg-gray-800 text-white placeholder-slate-400 invalid:text-pink-600 invalid:ring-pink-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:invalid:border-pink-600 focus:invalid:ring-pink-600 active:invalid:border-pink-600"
        ></input>
        <p className="py-1 text-sm text-pink-600">{errors.userName?.message}</p>
        <input
          type="email"
          id="email"
          required={!disableNewRoom}
          disabled={disableNewRoom}
          minLength={EmailSchema?.minLength ?? undefined}
          maxLength={EmailSchema?.maxLength ?? undefined}
          // pattern={EmailSchema.source.toString()}
          placeholder="Email"
          {...register('email')}
          className="h-12 rounded-md border border-slate-400 bg-gray-800 text-white placeholder-slate-400 invalid:text-pink-600 invalid:ring-pink-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:invalid:border-pink-600 focus:invalid:ring-pink-600 disabled:opacity-50"
        ></input>
        <p className="py-1 text-sm text-pink-600">{errors.email?.message}</p>
        <input
          type="number"
          id="membersNumber"
          required={!disableNewRoom}
          disabled={disableNewRoom}
          minLength={1}
          maxLength={2}
          placeholder="На сколько человек чат?"
          {...register('membersNumber')}
          defaultValue={2}
          className="h-12 rounded-md border border-slate-400 bg-gray-800 text-white placeholder-slate-400 invalid:text-pink-600 invalid:ring-pink-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:invalid:border-pink-600 focus:invalid:ring-pink-600 disabled:opacity-50"
        ></input>
        <p className="py-1 text-sm text-pink-600">
          {errors.membersNumber?.message}
        </p>

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center rounded-md bg-violet-700 text-white"
        >
          Присоединиться
        </button>
      </form>
    </div>
  );
};
