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

  // Check if we're waiting for specific inputs
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
}
