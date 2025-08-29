# bot.py
# Telegram-бот для запуска игры
import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
from telegram.constants import ParseMode
import time


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Добавляем timestamp для избежания кэширования
    timestamp = int(time.time())
    web_app_url = f"https://dmi-s.github.io/RonGame/webapp/index.html?t={timestamp}"

    await update.message.reply_text(
        "🎮 Добро пожаловать в игру 'Логистические роботы'!\n"
        "Нажмите кнопку ниже, чтобы начать игру.",
        reply_markup={
            "inline_keyboard": [[
                {"text": "Запустить игру", "web_app": {"url": web_app_url}}
            ]]
        }
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = """
🤖 *Логистические роботы* - игра-головоломка

*Правила игры:*
• Переместите всех роботов на свои места выгрузки
• Роботы должны заряжаться при низком заряде (<25%)
• Перед выгрузкой роботы должны загрузиться на станции погрузки
• Избегайте столкновений с препятствиями и другими роботами

*Управление:*
1. Нажмите на робота для выбора
2. Кликайте по клеткам для построения маршрута
3. Робот автоматически поедет по построенному пути

Удачи! 🚀
    """
    await update.message.reply_text(help_text, parse_mode=ParseMode.MARKDOWN)


def main():
    # Замените токен на ваш реальный токен бота
    app = Application.builder().token("8218546394:AAHV5oUGupEWqq071n18tpIR3Pce3ddlC2w").build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("game", start))  # Альтернативная команда

    print("Бот запущен...")
    app.run_polling()


if __name__ == "__main__":
    main()
