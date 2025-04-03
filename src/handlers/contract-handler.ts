import { SessionContext } from '../types';
import { escapeMarkdown } from '../utils/helpers';

export async function handleContractCommand(ctx: SessionContext) {
  // Check if the user is authenticated
  if (!ctx.session.isAuthenticated) {
    await ctx.reply('Please start the bot with /start command first.', {
      parse_mode: 'Markdown',
    });
    return;
  }

  await ctx.reply(
    'Please enter the contract address you want to explore (starting with 0x):',
    { parse_mode: 'Markdown' }
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
      '❌ *Invalid Ethereum address format*\n' +
        'Address should start with "0x" followed by 40 hex characters.\n' +
        'Please try again:',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  ctx.session.contractAddress = address;
  ctx.session.waitingForContractAddress = false;
  ctx.session.waitingForChainId = true;

  await ctx.reply(
    escapeMarkdown(
      '✅ *Contract address set*\n\n' +
        'Please enter the chain ID (e.g., `1` for Ethereum Mainnet, `137` for Polygon):'
    ),
    { parse_mode: 'MarkdownV2' }
  );
}

export async function handleChainIdInput(
  ctx: SessionContext,
  chainIdText: string
) {
  const chainId = parseInt(chainIdText.trim(), 10);

  if (isNaN(chainId) || chainId <= 0) {
    await ctx.reply('❌ *Invalid chain ID*. Please enter a positive number:', {
      parse_mode: 'MarkdownV2',
    });
    return;
  }

  ctx.session.chainId = chainId.toString();
  ctx.session.waitingForChainId = false;

  await ctx.reply(
    escapeMarkdown(
      `✅ *Chain ID set to ${chainId}*\n\n` +
        `Now analyzing contract \`${ctx.session.contractAddress}\` on chain ${chainId}...\n` +
        '_This may take a moment._'
    ),
    { parse_mode: 'MarkdownV2' }
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

    // Send the contract details
    await ctx.reply(
      escapeMarkdown(
        response.data.botMessage.botMessage || '*Contract details retrieved*'
      ),
      { parse_mode: 'MarkdownV2' }
    );
  } else {
    await ctx.reply(
      escapeMarkdown(
        '❌ *Failed to fetch contract details*\n' +
          `Error: ${response.error || 'Unknown error'}`
      ),
      { parse_mode: 'MarkdownV2' }
    );
  }
}
