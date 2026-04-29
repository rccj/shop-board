import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Lock } from 'lucide-react'
import { mockLogin } from '@/mock/auth'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const setToken = useAuthStore(s => s.setToken)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/admin/products'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const token = await mockLogin(username, password)
      setToken(token)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登入失敗')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">後台登入</h1>
          <p className="mt-1 text-sm text-muted-foreground">Shop Board 管理系統</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-background p-6 shadow-sm">
          <div className="space-y-1.5">
            <Label htmlFor="username">帳號</Label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登入中…
              </>
            ) : (
              '登入'
            )}
          </Button>
        </form>

        {/* Demo hint */}
        <p className="text-center text-xs text-muted-foreground">
          Demo 帳號：<span className="font-mono">admin</span> ／ 密碼：<span className="font-mono">admin123</span>
        </p>
      </div>
    </div>
  )
}
