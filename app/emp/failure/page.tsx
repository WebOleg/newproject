import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { XCircle, Home } from 'lucide-react'

export default function FailurePage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
      <Card className="max-w-md w-full shadow-xl border-red-200 dark:border-red-800">
        <CardContent className="pt-12 pb-8 px-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 dark:bg-red-900 p-4">
              <XCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-3 text-red-900 dark:text-red-100">
            Payment Failed
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Unfortunately, your transaction could not be processed. Please try again or contact support if the problem persists.
          </p>
          
          <div className="space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href="https://melinux.net">
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </Button>
            
            <p className="text-sm text-muted-foreground mt-4">
              Need help? Contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
