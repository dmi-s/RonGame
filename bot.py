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
