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
const bot = new TelegramBot(token);

// 🔐 Админ ID
const ADMIN_ID = 5625134095;

// 🔘 /start — приветствие + логирование
bot.onText(/\/start/, async (msg) => {
  const { id, username, first_name } = msg.from;

  const { error } = await supabase.from('bot_users').insert({
    telegram_id: id,
    username,
    first_name
  });

  if (error) {
    console.error("❌ Ошибка при логировании в Supabase:", error);
  } else {
    console.log(`✅ Пользователь добавлен: ${id} (${username || 'без username'})`);
  }

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

// 💌 /sendall — рассылка
bot.onText(/^\/sendall (.+)/, async (msg, match) => {
  if (msg.from.id !== ADMIN_ID) {
    return bot.sendMessage(msg.chat.id, "🚫 У тебя нет доступа к рассылке.");
  }

  const messageToSend = match[1];
  console.log("📤 Рассылка запущена админом. Текст:", messageToSend);

  try {
    const { data, error } = await supabase.from('bot_users').select('telegram_id');

    if (error) {
      console.error("❌ Ошибка Supabase при получении пользователей:", error);
      return bot.sendMessage(msg.chat.id, "⚠️ Ошибка при получении пользователей. Проверь RLS и таблицу bot_users.");
    }

    if (!data || data.length === 0) {
      console.warn("📭 Нет пользователей для рассылки.");
      return bot.sendMessage(msg.chat.id, "📭 Нет пользователей для рассылки.");
    }

    const ids = [...new Set(data.map(row => row.telegram_id))];
    let success = 0;

    for (const id of ids) {
      try {
        await bot.sendMessage(id, messageToSend);
        success++;
        await new Promise(res => setTimeout(res, 200));
      } catch (err) {
        console.warn(`⚠️ Ошибка отправки ${id}:`, err.message);
      }
    }

    console.log(`✅ Рассылка завершена. Отправлено: ${success}`);
    bot.sendMessage(msg.chat.id, `✅ Рассылка завершена. Отправлено: ${success}`);
  } catch (e) {
    console.error("❌ Фатальная ошибка при рассылке:", e);
    bot.sendMessage(msg.chat.id, "🚫 Фатальная ошибка при выполнении рассылки.");
  }
});

// ❓ /help — часто задаваемые вопросы
bot.onText(/\/help/, async (msg) => {
  const helpText = `❓ <b>Поддержка Go Travel</b>:

<b>— Частые вопросы:</b>
• Как забронировать отель?
• Как сохранить в избранное?
• Почему не загружается перелёт?

📬 Напиши свой вопрос, и мы ответим как можно скорее.`;

  bot.sendMessage(msg.chat.id, helpText, { parse_mode: "HTML" });
});

// 📬 /contact — обратная связь
bot.onText(/\/contact/, async (msg) => {
  const reply = `📨 Напиши напрямую менеджеру: <a href="https://t.me/Parshin_Alex">Parshin_Alex</a>`;
  bot.sendMessage(msg.chat.id, reply, { parse_mode: "HTML", disable_web_page_preview: true });
});

console.log("🚀 Go Travel Bot запущен и слушает /start и /sendall...");
