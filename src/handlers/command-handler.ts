import { SessionContext } from '../types';
import { createNewSession } from '../utils/api';
import { helpMessage } from '../utils/constants';
import { startTypingIndicator } from './message-handler';

export async function handleStartCommand(ctx: SessionContext) {
  // Show typing indicator while initializing
  const typingInterval = startTypingIndicator(ctx);

  try {
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

    // Create a new session with the API
    const response = await createNewSession(ctx.session.userId);

    if (response.success && response.data) {
      ctx.session.sessionId =
        response.data.sessionId || response.data.conversation.sessionId;

      await ctx.reply(
        `*👋 Welcome to Nebula Telegram Bot!*\n\n` +
          `I'm your assistant for blockchain contract exploration. Your session has been initialized successfully.\n\n` +
          helpMessage,
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      await ctx.reply(
        `Failed to initialize your session. Please try again later.\n` +
          `Error: ${response.error || 'Unknown error'}`
      );
    }
  } catch (error) {
    console.error('Error handling start command:', error);
    await ctx.reply('❌ An error occurred while starting the bot.');
  } finally {
    clearInterval(typingInterval);
  }
}

export async function handleHelpCommand(ctx: SessionContext) {
  await ctx.reply(helpMessage);
}
