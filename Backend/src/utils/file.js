import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// recria __dirname no ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Mantém os dados fora da pasta do backend para não disparar restart do nodemon a cada alteração.
const dataDirPath = path.resolve(__dirname, '../../../data')
const filePath = path.resolve(dataDirPath, 'devices.json')
// Fallback temporário para instalações que ainda estejam com o arquivo nos caminhos antigos.
const legacyFilePaths = [
  path.resolve(__dirname, '../../data/devices.json'),
  path.resolve(__dirname, '../data/devices.json')
]

function ensureDataDirectory() {
  if (!fs.existsSync(dataDirPath)) {
    fs.mkdirSync(dataDirPath, { recursive: true })
  }
}

export function readDevices() {
  // Prioriza o caminho atual, mas ainda consegue ler dados legados sem migrar manualmente.
  const pathToRead = [filePath, ...legacyFilePaths].find((candidatePath) =>
    fs.existsSync(candidatePath)
  )

  if (!pathToRead) return []

  const data = fs.readFileSync(pathToRead, 'utf-8')
  return JSON.parse(data)
}

export function saveDevices(devices) {
  ensureDataDirectory()
  fs.writeFileSync(filePath, JSON.stringify(devices, null, 2))
}
