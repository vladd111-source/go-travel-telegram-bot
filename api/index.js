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

// 🎯 Основной webhook handler
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
  const text = message.text;

  if (text === "/start") {
    await supabase.from("bot_users").insert({
      telegram_id: userId,
      username,
      first_name: firstName,
    });

    await sendMessage(chatId, "Открыть Go Travel WebApp 🌍", {
      inline_keyboard: [[
        {
          text: "🚀 Запустить",
          web_app: { url: "https://go-travel-frontend.vercel.app" },
        },
      ]],
    });
  }

  if (text.startsWith("/sendall") && userId === ADMIN_ID) {
    const msg = text.replace("/sendall", "").trim();
    const { data } = await supabase.from("bot_users").select("telegram_id");

    if (data?.length) {
      for (const row of data) {
        try {
          await sendMessage(row.telegram_id, msg);
          await new Promise(res => setTimeout(res, 200)); // антифлуд
        } catch (err) {
          console.warn("❌ Не удалось отправить:", err.message);
        }
      }

      await sendMessage(chatId, "✅ Рассылка завершена.");
    }
  }

  res.status(200).send("ok");
}

// 👇 Утилита для отправки сообщения
async function sendMessage(chatId, text, reply_markup = null) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(reply_markup && { reply_markup }),
  };

  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
