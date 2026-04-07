import './env.js'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import devicesRoutes from './routes/devices.routes.js'
import eventsRoutes from './routes/events.routes.js'
import { runMonitoring } from './services/monitor.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDistPath = path.resolve(__dirname, '../../Frontend/dist')
const frontendIndexPath = path.join(frontendDistPath, 'index.html')
const isPackagedMode = process.argv.includes('--packaged')
const devPort = Number(process.env.DEV_PORT) || 3000
const webappPort = Number(process.env.WEBAPP_PORT) || 3004
const port = isPackagedMode ? webappPort : devPort

const app = express()

app.use(cors())
app.use(express.json())

app.use('/devices', devicesRoutes)
app.use('/events', eventsRoutes)

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath))

  // Qualquer rota que nao seja da API devolve a SPA ja buildada.
  app.get(/^(?!\/(?:devices|events)(?:\/|$)).*/, (req, res) => {
    res.sendFile(frontendIndexPath)
  })
}

// primeira execução
runMonitoring()

// intervalo de 1 minuto
setInterval(runMonitoring, 60_000)

app.listen(port, () => {
  console.log(`🚀 Backend rodando na porta ${port}`)

  if (fs.existsSync(frontendDistPath)) {
    console.log(`🌐 Frontend servindo o dist em http://localhost:${port}`)
  } else {
    console.log('ℹ️ Dist do frontend não encontrado. Rode o build para servir a interface pelo backend.')
  }
})
