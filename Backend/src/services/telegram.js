import axios from 'axios'
import 'dotenv/config'

const token = process.env.TELEGRAM_BOT_TOKEN
const chatId = process.env.TELEGRAM_CHAT_ID

const api = axios.create({
  baseURL: `https://api.telegram.org/bot${token}`
})

export async function sendTelegram(message) {
  if (!token || !chatId) {
    console.warn('Telegram não configurado')
    return
  }

  try {
    await api.post('/sendMessage', {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    })
  } catch (err) {
    console.error('Erro Telegram:', err.message)
  }
}
