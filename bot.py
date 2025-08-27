import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, ContextTypes
from telegram import WebAppInfo
from telegram.ext import filters

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

TOKEN = "8218546394:AAHV5oUGupEWqq071n18tpIR3Pce3ddlC2w"


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    keyboard = [
        [InlineKeyboardButton("🎮 Играть в Пятнашки",
                              web_app=WebAppInfo(url="https://dmi-s.github.io/RonGame/webapp/index.html"))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "Добро пожаловать в игру 'Пятнашки'! 🎮\n\n"
        "Нажмите кнопку ниже, чтобы начать играть прямо в Telegram!",
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

    # Добавляем обработчики
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))

    # Запускаем бота
    application.run_polling()
    print("Бот запущен!")


if __name__ == "__main__":
    main()