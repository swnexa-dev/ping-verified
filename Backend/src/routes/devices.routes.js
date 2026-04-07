import express from 'express'
import { saveDevices, readDevices } from '../utils/file.js'
import { getStatus, runMonitoring } from '../services/monitor.service.js'

const router = express.Router()
const DEFAULT_GROUP = 'Sem grupo'

function normalizeName(value) {
  return value?.trim()
}

function normalizeIp(value) {
  return value?.trim()
}

function normalizeGroup(value) {
  // O grupo padrão precisa ser aplicado de forma consistente para deduplicação e edição.
  return value?.trim() || DEFAULT_GROUP
}

function isDuplicateDevice(devices, targetDevice, excludeId = null) {
  // Nome + IP + grupo formam a identidade lógica do cadastro dentro da aplicação.
  return devices.some((device) => {
    if (excludeId !== null && Number(device.id) === Number(excludeId)) {
      return false
    }

    const deviceGroup = normalizeGroup(device.group)

    return (
      device.name?.trim().toLowerCase() === targetDevice.name.toLowerCase() &&
      device.ip?.trim().toLowerCase() === targetDevice.ip.toLowerCase() &&
      deviceGroup.toLowerCase() === targetDevice.group.toLowerCase()
    )
  })
}

async function refreshMonitoringSafely() {
  // Atualiza o snapshot logo após mudanças estruturais sem deixar a API falhar se o ping travar.
  try {
    await runMonitoring()
  } catch (err) {
    console.error('Erro ao atualizar monitoramento após salvar dispositivos:', err)
  }
}

// Listar dispositivos
router.get('/', (req, res) => {
  res.json(getStatus())
})

// Adicionar dispositivo
router.post('/', async (req, res) => {
  const normalizedName = normalizeName(req.body?.name)
  const normalizedIp = normalizeIp(req.body?.ip)
  const normalizedGroup = normalizeGroup(req.body?.group)

  if (!normalizedName || !normalizedIp) {
    return res.status(400).json({ error: 'Nome e IP obrigatórios' })
  }

  const devices = readDevices()
  const candidateDevice = {
    name: normalizedName,
    ip: normalizedIp,
    group: normalizedGroup
  }

  if (isDuplicateDevice(devices, candidateDevice)) {
    return res.status(409).json({ error: 'Esse dispositivo já está cadastrado nesse grupo' })
  }

  devices.push({
    id: Date.now(),
    name: normalizedName,
    ip: normalizedIp,
    group: normalizedGroup,
    // O estado real será preenchido pela leitura imediata após o save.
    online: false,
    lastCheck: null,
    offlineSince: null
  })

  try {
    saveDevices(devices)
    await refreshMonitoringSafely()

    res.status(201).json({ message: 'Dispositivo adicionado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao salvar dispositivo' })
  }
})

// Editar dispositivo
router.put('/:id', async (req, res) => {
  const deviceId = Number(req.params.id)
  const normalizedName = normalizeName(req.body?.name)
  const normalizedIp = normalizeIp(req.body?.ip)

  if (!Number.isFinite(deviceId)) {
    return res.status(400).json({ error: 'ID inválido' })
  }

  if (!normalizedName || !normalizedIp) {
    return res.status(400).json({ error: 'Nome e IP obrigatórios' })
  }

  const devices = readDevices()
  const targetIndex = devices.findIndex((device) => Number(device.id) === deviceId)

  if (targetIndex === -1) {
    return res.status(404).json({ error: 'Dispositivo não encontrado' })
  }

  const currentDevice = devices[targetIndex]
  const candidateDevice = {
    name: normalizedName,
    ip: normalizedIp,
    group: normalizeGroup(currentDevice.group)
  }

  if (isDuplicateDevice(devices, candidateDevice, deviceId)) {
    return res.status(409).json({ error: 'Já existe outro dispositivo com esses dados nesse grupo' })
  }

  devices[targetIndex] = {
    ...currentDevice,
    name: normalizedName,
    ip: normalizedIp
  }

  try {
    saveDevices(devices)
    await refreshMonitoringSafely()

    res.json({ message: 'Dispositivo atualizado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao atualizar dispositivo' })
  }
})

// Excluir dispositivos em lote
router.post('/bulk-delete', async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((id) => Number(id)).filter(Number.isFinite)
    : []

  if (!ids.length) {
    return res.status(400).json({ error: 'Selecione ao menos um dispositivo' })
  }

  const idSet = new Set(ids)
  const devices = readDevices()
  const remainingDevices = devices.filter((device) => !idSet.has(Number(device.id)))
  const removedCount = devices.length - remainingDevices.length

  if (!removedCount) {
    return res.status(404).json({ error: 'Nenhum dispositivo encontrado para exclusão' })
  }

  try {
    saveDevices(remainingDevices)
    await refreshMonitoringSafely()

    res.json({ message: 'Dispositivos removidos', removedCount })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao remover dispositivos' })
  }
})

export default router
