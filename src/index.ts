import dotenv from 'dotenv';
import { Context, Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { Update } from 'telegraf/typings/core/types/typegram';
import { handleStartCommand } from './handlers/command-handler';
import { handleContractCommand } from './handlers/contract-handler';
import { handleMessage } from './handlers/message-handler';
import { UserSession } from './types';
import connectToDatabase from './utils/db';
import { escapeMarkdown } from './utils/helpers';

// Load environment variables
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
  process.exit(1);
}
// Create bot instance
interface MyContext extends Context<Update> {
  session: UserSession;
}
const bot = new Telegraf<MyContext>(BOT_TOKEN);

// Initialize session middleware
bot.use(session());

// Initialize session data for new users
bot.use((ctx, next) => {
  if (!ctx.session) {
    ctx.session = {
      userId: ctx.from?.id.toString() || '',
      sessionId: '',
      chainId: '',
      contractAddress: '',
      waitingForContractAddress: false,
      waitingForChainId: false,
      isAuthenticated: false,
    };
  }
  return next();
});

// Connect to MongoDB
connectToDatabase()
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Register command handlers
bot.command('start', handleStartCommand);
bot.command('contract', handleContractCommand);
bot.help((ctx) => {
  ctx.reply(
    escapeMarkdown(
      '*Available commands:*\n' +
        '/start - Start or reset the bot\n' +
        '/help - Show this help message\n' +
        '/contract - Set contract context for chain analysis\n\n' +
        'You can also send any text to chat with the bot.\n\n' +
        'Note: When you set a contract context, all subsequent questions will be answered in relation to that contract.'
    ),
    { parse_mode: 'MarkdownV2' }
  );
});

// Handle incoming messages
bot.on(message('text'), handleMessage);

// Start the bot
bot
  .launch()
  .then(() => {
    console.log('Bot started successfully');
  })
  .catch((err) => {
    console.error('Failed to start bot:', err);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
