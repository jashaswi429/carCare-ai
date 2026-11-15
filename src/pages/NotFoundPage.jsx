import { Link } from 'react-router-dom'
import { Button, Card, EmptyState } from '@/components/ui/Primitives'

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f6f7fb] px-4">
      <Card className="w-full max-w-lg">
        <EmptyState
          icon="alert"
          title="Page not found"
          description="The page you were looking for doesn't exist or has moved."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button as={Link} to="/dashboard" icon="dashboard">
                Go to dashboard
              </Button>
              <Button as={Link} to="/" variant="secondary">
                Back to home
              </Button>
            </div>
          }
        />
      </Card>
    </div>
  )
}
