import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Home } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
      <Card className="max-w-md w-full shadow-xl border-green-200 dark:border-green-800">
        <CardContent className="pt-12 pb-8 px-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-3 text-green-900 dark:text-green-100">
            Payment Successful
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Your transaction has been completed successfully. Thank you for your payment.
          </p>
          
          <div className="space-y-3">
            <Button asChild size="lg" className="w-full bg-green-600 hover:bg-green-700">
              <Link href="https://melinux.net">
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </Button>
            
            <p className="text-sm text-muted-foreground">
              You can close this window now.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
