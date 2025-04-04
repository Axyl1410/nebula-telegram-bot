import { SessionContext } from '../types';
import { escapeMarkdown } from '../utils/helpers';

export async function handleContractCommand(ctx: SessionContext) {
  // Check if the user is authenticated
  if (!ctx.session.isAuthenticated) {
    await ctx.reply('Please start the bot with /start command first.');
    return;
  }

  await ctx.reply(
    'Please enter the contract address you want to explore (starting with 0x):'
  );

  ctx.session.waitingForContractAddress = true;
  ctx.session.waitingForChainId = false;
}

export async function handleContractAddressInput(
  ctx: SessionContext,
  address: string
) {
  // Basic validation for Ethereum addresses
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    await ctx.reply(
      '❌ Invalid Ethereum address format.\n' +
        'Address should start with "0x" followed by 40 hex characters.\n' +
        'Please try again:'
    );
    return;
  }

  ctx.session.contractAddress = address;
  ctx.session.waitingForContractAddress = false;
  ctx.session.waitingForChainId = true;

  await ctx.reply(
    '✅ Contract address set.\n\n' +
      'Please enter the chain ID (e.g., 1 for Ethereum Mainnet, 137 for Polygon):'
  );
}

export async function handleChainIdInput(
  ctx: SessionContext,
  chainIdText: string
) {
  const chainId = parseInt(chainIdText.trim(), 10);

  if (isNaN(chainId) || chainId <= 0) {
    await ctx.reply('❌ Invalid chain ID. Please enter a positive number:');
    return;
  }

  ctx.session.chainId = chainId.toString();
  ctx.session.waitingForChainId = false;

  await ctx.reply(
    `✅ Chain ID set to ${chainId}.\n\n` +
      `Now analyzing contract ${ctx.session.contractAddress} on chain ${chainId}...\n` +
      'This may take a moment.'
  );

  await ctx.sendChatAction('typing');

  const typingInterval = setInterval(async () => {
    try {
      await ctx.sendChatAction('typing');
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, 4500);

  // Now fetch the contract details
  const { getContractDetails } = await import('../utils/api');
  const response = await getContractDetails(
    ctx.session.userId,
    ctx.session.sessionId,
    ctx.session.contractAddress,
    ctx.session.chainId
  );

  clearInterval(typingInterval);

  if (response.success && response.data) {
    // Update session ID if it changed
    if (
      response.data.sessionId &&
      response.data.sessionId !== ctx.session.sessionId
    ) {
      ctx.session.sessionId = response.data.sessionId;
    }

    const botMessage =
      response.data.botMessage.botMessage || 'No response from the bot.';

    // Send the contract details
    await ctx.reply(escapeMarkdown(botMessage), { parse_mode: 'MarkdownV2' });
  } else {
    await ctx.reply(
      '❌ Failed to fetch contract details.\n' +
        `Error: ${response.error || 'Unknown error'}`
    );
  }
}
