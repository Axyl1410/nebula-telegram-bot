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

  // Start typing indicator immediately when any message is received
  const typingInterval = startTypingIndicator(ctx);

  try {
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
  } catch (error) {
    console.error('Error handling message:', error);
    await ctx.reply('❌ An error occurred while processing your message.');
  } finally {
    clearInterval(typingInterval);
  }
}

export function startTypingIndicator(ctx: SessionContext): NodeJS.Timeout {
  ctx
    .sendChatAction('typing')
    .catch((err) => console.error('Error sending chat action:', err));

  return setInterval(() => {
    ctx
      .sendChatAction('typing')
      .catch((err) => console.error('Error sending chat action:', err));
  }, 4500);
}

async function handleChatMessage(ctx: SessionContext, messageText: string) {
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
      response.data.botMessage.botMessage || 'No response from the bot.',
      { parse_mode: 'MarkdownV2' }
    );
  } else {
    await ctx.reply(
      '❌ Failed to get a response.\n' +
        `Error: ${response.error || 'Unknown error'}`
    );
  }
}
