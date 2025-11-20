import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Home } from 'lucide-react'

export default function PendingPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
      <Card className="max-w-md w-full shadow-xl border-yellow-200 dark:border-yellow-800">
        <CardContent className="pt-12 pb-8 px-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900 p-4">
              <Clock className="h-16 w-16 text-yellow-600 dark:text-yellow-400 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-3 text-yellow-900 dark:text-yellow-100">
            Payment Pending
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Your transaction is being processed. You will receive a confirmation once the payment is complete.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⏱️ This process may take a few moments. Please do not refresh or close this page.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button asChild size="lg" className="w-full bg-yellow-600 hover:bg-yellow-700">
              <Link href="https://melinux.net">
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Check your email for transaction updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
