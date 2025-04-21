require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;

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
