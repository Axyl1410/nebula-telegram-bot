import { SessionContext } from '../types';
import { createNewSession } from '../utils/api';
import { helpMessage } from '../utils/constants';

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

  // Create a new session with the API
  const response = await createNewSession(ctx.session.userId);

  if (response.success && response.data) {
    ctx.session.sessionId =
      response.data.sessionId || response.data.conversation.sessionId;

    await ctx.reply(
      `👋 Welcome to Nebula Telegram Bot!\n\n` +
        `I'm your assistant for blockchain contract exploration. Your session has been initialized successfully.\n\n` +
        helpMessage
    );
  } else {
    await ctx.reply(
      `Failed to initialize your session. Please try again later.\n` +
        `Error: ${response.error || 'Unknown error'}`
    );
  }
}

export async function handleHelpCommand(ctx: SessionContext) {
  await ctx.reply(helpMessage);
}
