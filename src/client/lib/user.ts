import { Room, User } from '../../shared/interfaces/chat.interface';
import axios from 'axios';
import { LoginFormInputs } from '../components/login.form';

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

export const generateRoomName = () => {
  return 'room-' + Math.floor(Math.random() * 100000).toString();
};

export const handleJoin = async (data: LoginFormInputs) => {
  try {
    const response = await axios.post('http://localhost:3003/chat/join', data);

    if (response.data.roomId) {
      alert(`Joined Room: ${response.data.roomId}`);
    } else if (response.data.message) {
      alert(response.data.message);
    }
  } catch (error) {
    console.error('Error joining the chat:', error);
    alert('Failed to join the chat.');
  }
};
