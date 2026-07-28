export async function subscribeToPush(): Promise<boolean> {
  return false
}

export async function unsubscribeFromPush(): Promise<boolean> {
  return false
}

export async function sendPushMessage(_message: string): Promise<boolean> {
  return false
}

export async function sendMessageToUser(_userId: string, _message: string): Promise<boolean> {
  return false
}
