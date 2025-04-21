require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

// Supabase init
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Telegram init
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const ADMIN_ID = 5625134095; // 👈 Замени на свой Telegram ID

// ✅ Установка описания бота
bot.setMyDescription("🌍 Go Travel — ищи билеты, отели и места через Telegram WebApp ✈️")
  .then(() => console.log("✅ Описание бота обновлено"))
  .catch(err => console.error("❌ Ошибка при обновлении описания:", err));

// 🔘 /start
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

// 💌 /sendall
bot.onText(/^\/sendall (.+)/, async (msg, match) => {
  if (msg.from.id !== ADMIN_ID) {
    return bot.sendMessage(msg.chat.id, "🚫 У тебя нет доступа к рассылке.");
  }

  const messageToSend = match[1];

  const { data, error } = await supabase.from('bot_logs').select('telegram_id');

  if (error) {
    console.error("❌ Ошибка Supabase:", error);
    return bot.sendMessage(msg.chat.id, "⚠️ Ошибка при получении пользователей.");
  }

  const ids = [...new Set(data.map(row => row.telegram_id))]; // уникальные ID
  let success = 0;

  for (const id of ids) {
    try {
      await bot.sendMessage(id, messageToSend);
      success++;
      await new Promise(res => setTimeout(res, 200)); // пауза
    } catch (err) {
      console.warn(`⚠️ Не удалось отправить ${id}:`, err.message);
    }
  }

  bot.sendMessage(msg.chat.id, `✅ Рассылка завершена. Отправлено: ${success}`);
});

console.log("🚀 Go Travel Bot запущен и слушает /start и /sendall...");
