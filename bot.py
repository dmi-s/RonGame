import logging
import asyncio
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
    keyboard = [
        [InlineKeyboardButton("🤖 Логистические роботы", 
                             web_app=WebAppInfo(url="https://dmi-s.github.io/RonGame/webapp/index.html"))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Добро пожаловать в 'Логистические роботы'! 🤖\n\n"
        "Перемещайте роботов через станции к их гаражам!\n"
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
    # Создаем Application
    application = Application.builder().token(TOKEN).build()
    
    # Добавляем обработчики
    application.add_handler(CommandHandler("start", start))
    
    # Обработчик данных из веб-приложения
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    
    # Запускаем бота
    print("Бот запускается...")
    application.run_polling()
    print("Бот запущен!")

if __name__ == "__main__":
    main()
