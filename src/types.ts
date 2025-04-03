import { Context } from 'telegraf';

export interface UserSession {
  userId: string;
  sessionId: string;
  chainId: string;
  contractAddress: string;
  waitingForContractAddress: boolean;
  waitingForChainId: boolean;
  isAuthenticated: boolean;
  lastMessageTime?: number; // Add this field
  isProcessingMessage?: boolean; // Add this field
}

export interface SessionContext extends Context {
  session: UserSession;
}

export interface Message {
  _id: string;
  userMessage: string | null;
  botMessage: string | null;
  timestamp: string;
}

export interface Conversation {
  _id: string;
  userId: string;
  sessionId: string;
  title: string;
  lastChatTime: string;
  chainId?: string;
  contractAddress?: string;
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
};
