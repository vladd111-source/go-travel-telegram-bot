import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import TelegramBot from 'node-telegram-bot-api';

// Supabase config
const supabaseUrl = 'https://hubrgeitdvodttderspj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YnJnZWl0ZHZvZHR0ZGVyc3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNzY0OTEsImV4cCI6MjA1ODc1MjQ5MX0.K44XhDzjOodHzgl_cx80taX8Vgg_thFAVEesZUvKNnA'; // уже есть
const supabase = createClient(supabaseUrl, supabaseKey);

// Telegram Bot Token
const token = process.env.BOT_TOKEN; // Используй dotenv или вставь напрямую
const bot = new TelegramBot(token, { polling: false });

const message = "🌍 Привет! У нас новые билеты и отели — зайди в Go Travel WebApp ✈️";

// Главная функция
async function broadcast() {
  const { data, error } = await supabase.from('bot_logs').select('telegram_id');

  if (error) {
    console.error("❌ Ошибка при получении пользователей из Supabase:", error);
    return;
  }

  let success = 0;

  for (const row of data) {
    try {
      await bot.sendMessage(row.telegram_id, message);
      success++;
      await new Promise(res => setTimeout(res, 200)); // анти-флуд пауза
    } catch (err) {
      console.warn(`⚠️ Не удалось отправить ${row.telegram_id}:`, err.message);
    }
  }

  console.log(`✅ Рассылка завершена. Успешно отправлено: ${success}`);
}

broadcast();
//✈️ «Добавлены дешёвые рейсы из Киева в Порту — загляни»
//🧳 «Go Travel теперь подбирает жильё по завтракам 🍳»
//🎁 «Подарок: получи чеклист путешественника — нажми здесь»
//📲 «Тапни и открой новый WebApp интерфейс»
