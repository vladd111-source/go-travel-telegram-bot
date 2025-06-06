import TelegramBot from "node-telegram-bot-api";
import { createClient } from "@supabase/supabase-js";

// Supabase init
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Telegram init
const bot = new TelegramBot(process.env.BOT_TOKEN);

// 🔐 Админ ID
const ADMIN_ID = 5625134095;

// 🎯 Webhook handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { message } = req.body;

  if (!message || !message.text) {
    return res.status(200).send("No message content");
  }

  const chatId = message.chat.id;
  const userId = message.from.id;
  const username = message.from.username || "";
  const firstName = message.from.first_name || "";
  const text = message.text.trim();

  // 🔘 Команда /start
  if (text === "/start") {
    const { error } = await supabase.from("bot_users").insert({
      telegram_id: userId,
      username,
      first_name: firstName,
    });

    if (error) {
      console.error("❌ Ошибка Supabase при вставке:", error.message);
    } else {
      console.log(`✅ Зарегистрирован: ${firstName} (${username || "без username"})`);
    }

    await sendMessage(chatId, "Открыть Go Travel WebApp 🌍", {
      inline_keyboard: [[
        {
          text: "🚀 Запустить",
          web_app: { url: "https://go-travel-frontend.vercel.app" },
        }
      ]]
    });

    return res.status(200).send("start handled");
  }

  // 💌 Команда /sendall
  if (text.startsWith("/sendall") && userId === ADMIN_ID) {
    const msg = text.replace("/sendall", "").trim();

    if (!msg) {
      await sendMessage(chatId, "⚠️ Укажи текст после /sendall");
      return res.status(200).send("no message");
    }

    const { data, error } = await supabase.from("bot_users").select("telegram_id");

    if (error) {
      console.error("❌ Ошибка Supabase при чтении:", error.message);
      await sendMessage(chatId, "🚫 Ошибка чтения пользователей.");
      return res.status(200).send("read error");
    }

    if (!data?.length) {
      await sendMessage(chatId, "📭 Нет пользователей для рассылки.");
      return res.status(200).send("no users");
    }

    let success = 0;

    for (const row of data) {
      try {
        await sendMessage(row.telegram_id, msg);
        await new Promise(res => setTimeout(res, 200));
        success++;
      } catch (err) {
        console.warn(`⚠️ Ошибка при отправке ${row.telegram_id}:`, err.message);
      }
    }

    await sendMessage(chatId, `✅ Рассылка завершена. Отправлено: ${success}`);
    return res.status(200).send("sendall done");
  }

  return res.status(200).send("ok");
}

// 📤 Утилита для отправки сообщений
async function sendMessage(chatId, text, reply_markup = null) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(reply_markup && { reply_markup }),
  };

  try {
    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("❌ Ошибка при отправке сообщения:", err.message);
  }
}
