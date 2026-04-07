import { readDevices } from '../utils/file.js'
import { checkDevice } from './ping.service.js'
import { addEvent } from './events.service.js'
import { sendTelegram } from './telegram.js'

let deviceStatus = []
let monitoringPromise = null

// Usa histerese simples para reduzir flapping em hosts com perda intermitente.
const OFFLINE_THRESHOLD = 3
const ONLINE_THRESHOLD = 2

async function executeMonitoring() {
  const devices = readDevices()
  const now = new Date()

  deviceStatus = await Promise.all(
    devices.map(async (device) => {
      const previous = deviceStatus.find(d => d.id === device.id)

      const pingResult = await checkDevice(device.ip)
      const isFirstCheck = !previous

      let online = previous?.online
      let offlineSince = previous?.offlineSince ?? null
      let failCount = previous?.failCount ?? 0
      let successCount = previous?.successCount ?? 0

      // Sem histórico em memória, o primeiro ping define o estado inicial real do dispositivo.
      if (isFirstCheck) {
        online = pingResult.online
        offlineSince = pingResult.online ? null : now
        failCount = pingResult.online ? 0 : 1
        successCount = pingResult.online ? 1 : 0
      }
      else if (pingResult.online) {
        successCount++
        failCount = 0

        // Exige confirmações consecutivas para evitar "subidas" falsas por respostas isoladas.
        if (!online && successCount >= ONLINE_THRESHOLD) {
          online = true
          offlineSince = null
        }
      }
      else {
        failCount++
        successCount = 0

        // Só declara indisponibilidade após falhas consecutivas para absorver oscilações curtas.
        if (online && failCount >= OFFLINE_THRESHOLD) {
          online = false
          offlineSince = now
        }
      }

      // Evento e notificação só saem quando a transição foi realmente confirmada.
      if (previous && previous.online !== online) {
        addEvent({
          deviceId: device.id,
          name: device.name,
          ip: device.ip,
          from: previous.online ? 'online' : 'offline',
          to: online ? 'online' : 'offline',
          at: now
        })

        console.log(
          `⚠️ ${device.name} ${previous.online ? 'ONLINE' : 'OFFLINE'} → ${online ? 'ONLINE' : 'OFFLINE'}`
        )

        // Telegram acompanha a mesma transição confirmada registrada no histórico.
        if (!online) {
          await sendTelegram(
            `🔴 <b>${device.name}</b>\nIP: ${device.ip}\nStatus: OFFLINE`
          )
        } else {
          await sendTelegram(
            `🟢 <b>${device.name}</b>\nStatus: ONLINE novamente`
          )
        }
      }

      return {
        ...device,
        online,
        offlineSince,
        failCount,
        successCount,
        time: pingResult.time,
        lastCheck: now
      }
    })
  )

  return deviceStatus
}

export async function runMonitoring() {
  // Serializa execuções para impedir que gatilhos concorrentes sobrescrevam o mesmo snapshot.
  if (monitoringPromise) {
    return monitoringPromise
  }

  monitoringPromise = executeMonitoring().finally(() => {
    monitoringPromise = null
  })

  return monitoringPromise
}

export function getStatus() {
  return deviceStatus
}
