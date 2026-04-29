export async function mockLogin(username: string, password: string): Promise<string> {
  await new Promise(r => setTimeout(r, 600))
  if (username === 'admin' && password === 'admin123') {
    return 'mock-token-' + Date.now()
  }
  throw new Error('帳號或密碼錯誤')
}
