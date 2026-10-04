const DEVICE_ID_KEY = 'attendancy-device-id'

export function getDeviceId(): string {
  const current = localStorage.getItem(DEVICE_ID_KEY)
  if (current) return current

  const deviceId = crypto.randomUUID()
  localStorage.setItem(DEVICE_ID_KEY, deviceId)
  return deviceId
}
