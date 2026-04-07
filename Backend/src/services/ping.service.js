import ping from 'ping'

export async function checkDevice(ip) {
  const result = await ping.promise.probe(ip, {
    timeout: 2,
  })

  return {
    online: result.alive,
    time: result.time,
  }
}
