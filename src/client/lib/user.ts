import { User } from '../../shared/interfaces/chat.interface';

export const setUser = ({
  userId,
  userName,
  email,
}: Pick<User, 'userId' | 'userName' | 'email'>) => {
  sessionStorage.setItem('userId', userId);
  sessionStorage.setItem('userName', userName);
  sessionStorage.setItem('email', email);
};

export const unsetUser = () => {
  sessionStorage.removeItem('userId');
  sessionStorage.removeItem('userName');
  sessionStorage.removeItem('email');
};

export const getUser = () => {
  const userId = sessionStorage.getItem('userId');
  const userName = sessionStorage.getItem('userName');
  const email = sessionStorage.getItem('email');
  return {
    userId,
    userName,
    email,
  };
};

export const generateUserId = (userName: User['userName']) => {
  return Date.now().toLocaleString().concat(userName);
};
