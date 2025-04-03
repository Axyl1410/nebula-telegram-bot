/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import dotenv from 'dotenv';
import { ApiResponse } from '../types';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const NEBULA_SECRET_KEY = process.env.NEBULA_SECRET_KEY;

if (!NEBULA_SECRET_KEY) {
  throw new Error('SECRET_KEY is not defined');
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  method: string,
  data?: any
): Promise<ApiResponse<T>> {
  try {
    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': NEBULA_SECRET_KEY as string,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(
      `API Error (${endpoint}):`,
      error.response?.data || error.message
    );
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      statusCode: error.response?.status,
    };
  }
}

// Start a new session or conversation
export async function createNewSession(
  userId: string
): Promise<ApiResponse<{ conversation: any; sessionId: string }>> {
  return apiRequest('/conversations', 'POST', {
    userId,
    title: `Telegram Bot Session ${new Date().toLocaleString()}`,
  });
}

// Send a message and get a response
export async function sendMessage(
  userId: string,
  sessionId: string,
  userMessage: string,
  chainId?: string,
  contractAddress?: string
): Promise<
  ApiResponse<{ userMessage: any; botMessage: any; sessionId: string }>
> {
  const payload: any = {
    userId,
    sessionId,
    userMessage,
  };

  if (chainId && contractAddress) {
    payload.chainId = chainId;
    payload.contractAddress = contractAddress;
  }

  return apiRequest('/chat', 'POST', payload);
}

// Get contract details
export async function getContractDetails(
  userId: string,
  sessionId: string,
  contractAddress: string,
  chainId: string
): Promise<
  ApiResponse<{ systemMessage: any; botMessage: any; sessionId: string }>
> {
  return apiRequest('/contract', 'POST', {
    userId,
    sessionId,
    contractAddress,
    chainId,
  });
}
