import express from 'express'
import cors from 'cors'

import devicesRoutes from './routes/devices.routes.js'
import eventsRoutes from './routes/events.routes.js'
import { runMonitoring } from './services/monitor.service.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/devices', devicesRoutes)
app.use('/events', eventsRoutes)

// primeira execução
runMonitoring()

// intervalo de 1 minuto
setInterval(runMonitoring, 60_000)

app.listen(3000, () => {
  console.log('🚀 Backend rodando na porta 3000')
})
