# bot.py
import logging
import time
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes, filters

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

TOKEN = "8218546394:AAHV5oUGupEWqq071n18tpIR3Pce3ddlC2w"


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    # Добавляем timestamp к URL чтобы избежать кэширования
    timestamp = int(time.time())
    webapp_url = f"https://dmi-s.github.io/RonGame/webapp/index.html?t={timestamp}"

    keyboard = [
        [InlineKeyboardButton("🤖 Логистические роботы",
                              web_app=WebAppInfo(url=webapp_url))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "Добро пожаловать в 'Логистические роботы'! 🤖\n\n"
        "Перемещайте роботов через станцию погрузки к месту выгрузки!\n"
        "Следите за уровнем заряда батареи!",
        reply_markup=reply_markup
    )


async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка данных из веб-приложения"""
    if update.message and update.message.web_app_data:
        data = update.message.web_app_data.data
        await update.message.reply_text(f"Спасибо за игру! Результат: {data}")


def main():
    """Запуск бота"""
    application = Application.builder().token(TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))

    print("Бот запускается...")
    application.run_polling()
    print("Бот запущен!")


if __name__ == "__main__":
    main()