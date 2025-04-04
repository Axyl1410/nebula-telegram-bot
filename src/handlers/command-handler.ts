import { SessionContext } from '../types';
import { createNewSession } from '../utils/api';
import { helpMessage } from '../utils/constants';
import { escapeMarkdown } from '../utils/helpers';

export async function handleStartCommand(ctx: SessionContext) {
  // Reset the session
  ctx.session = {
    userId: ctx.from?.id.toString() || '',
    sessionId: '',
    chainId: '',
    contractAddress: '',
    waitingForContractAddress: false,
    waitingForChainId: false,
    isAuthenticated: true, // Auto-authenticate for simplicity
  };

  await ctx.sendChatAction('typing');

  const typingInterval = setInterval(async () => {
    try {
      await ctx.sendChatAction('typing');
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, 4500);

  // Create a new session with the API
  const response = await createNewSession(ctx.session.userId);

  clearInterval(typingInterval);

  if (response.success && response.data) {
    ctx.session.sessionId =
      response.data.sessionId || response.data.conversation.sessionId;

    await ctx.reply(
      escapeMarkdown(
        `*👋 Welcome to Nebula Telegram Bot!*\n\n` +
          `I'm your assistant for blockchain contract exploration. Your session has been initialized successfully.\n\n` +
          helpMessage
      ),
      { parse_mode: 'MarkdownV2' }
    );
  } else {
    await ctx.reply(
      `Failed to initialize your session. Please try again later.\n` +
        `Error: ${response.error || 'Unknown error'}`
    );
  }
}
