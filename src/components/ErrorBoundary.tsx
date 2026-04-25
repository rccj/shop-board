import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : '發生未預期的錯誤'
    return { hasError: true, message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-4xl">⚠️</p>
          <h2 className="text-xl font-semibold">頁面發生錯誤</h2>
          <p className="text-sm text-muted-foreground max-w-sm">{this.state.message}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            重新整理
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
