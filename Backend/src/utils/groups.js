import fs from 'fs'
import path from 'path'

const filePath = path.resolve('src/data/groups.json')

export function readGroups() {
  try {
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveGroups(groups) {
  fs.writeFileSync(filePath, JSON.stringify(groups, null, 2))
}

export function addGroup(group) {
  const groups = readGroups()
  if (!groups.includes(group)) {
    groups.push(group)
    saveGroups(groups)
  }
}
