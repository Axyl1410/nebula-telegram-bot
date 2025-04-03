import { SessionContext } from '../types';
import { createNewSession, sendMessage } from '../utils/api';
import {
  handleChainIdInput,
  handleContractAddressInput,
} from './contract-handler';

export async function handleMessage(ctx: SessionContext) {
  if (!ctx.message || !('text' in ctx.message)) {
    return;
  }

  const messageText = ctx.message.text;

  if (ctx.session.waitingForContractAddress) {
    await handleContractAddressInput(ctx, messageText);
    return;
  }

  if (ctx.session.waitingForChainId) {
    await handleChainIdInput(ctx, messageText);
    return;
  }

  // Handle normal chat message
  await handleChatMessage(ctx, messageText);
}

async function handleChatMessage(ctx: SessionContext, messageText: string) {
  // Check if user is authenticated
  if (!ctx.session.isAuthenticated) {
    await ctx.reply('Please start the bot with /start command first.');
    return;
  }

  // Add a rate limiter/debounce mechanism
  const now = Date.now();
  const lastMessageTime = ctx.session.lastMessageTime || 0;

  // Prevent messages sent too quickly (1 second minimum)
  if (now - lastMessageTime < 1000) {
    await ctx.reply('Please wait a moment before sending another message.');
    return;
  }

  // Update last message timestamp
  ctx.session.lastMessageTime = now;

  // If no sessionId, create a new one
  if (!ctx.session.sessionId) {
    const response = await createNewSession(ctx.session.userId);
    if (response.success && response.data) {
      ctx.session.sessionId =
        response.data.sessionId || response.data.conversation.sessionId;
    } else {
      await ctx.reply(
        '❌ Failed to create a new session. Please try /start again.\n' +
          `Error: ${response.error || 'Unknown error'}`
      );
      return;
    }
  }

  // Show typing indicator
  await ctx.sendChatAction('typing');

  // Set a processing flag to prevent duplicate requests
  if (ctx.session.isProcessingMessage) {
    await ctx.reply('Still processing your previous message, please wait.');
    return;
  }

  try {
    ctx.session.isProcessingMessage = true;

    // Send the message to API
    const response = await sendMessage(
      ctx.session.userId,
      ctx.session.sessionId,
      messageText,
      ctx.session.chainId || undefined,
      ctx.session.contractAddress || undefined
    );

    if (response.success && response.data) {
      // Update session ID if it changed
      if (
        response.data.sessionId &&
        response.data.sessionId !== ctx.session.sessionId
      ) {
        ctx.session.sessionId = response.data.sessionId;
      }

      // Send the bot response
      await ctx.reply(
        response.data.botMessage.botMessage || 'No response from the bot.'
      );
    } else {
      await ctx.reply(
        '❌ Failed to get a response.\n' +
          `Error: ${response.error || 'Unknown error'}`
      );
    }
  } catch (error) {
    console.error('Error processing message:', error);
    await ctx.reply('An unexpected error occurred processing your message.');
  } finally {
    // Always clear the processing flag when done
    ctx.session.isProcessingMessage = false;
  }
}
