const TelegramBot = require('node-telegram-bot-api');

// Токен твоего Telegram-бота (временно)
const token = '7578471612:AAGTv-fDtv4qqSXskIl6xI6Cs4vOHlkv3LA';

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Открыть Go Travel WebApp 🌍', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '🚀 Запустить',
          web_app: { url: 'https://go-travel-frontend.vercel.app' }
        }
      ]]
    }
  });
});
