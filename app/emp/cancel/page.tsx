import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Ban, Home } from 'lucide-react'

export default function CancelPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20">
      <Card className="max-w-md w-full shadow-xl border-gray-200 dark:border-gray-800">
        <CardContent className="pt-12 pb-8 px-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-gray-100 dark:bg-gray-900 p-4">
              <Ban className="h-16 w-16 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">
            Payment Cancelled
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            The transaction was cancelled. No charges have been made to your account.
          </p>
          
          <div className="space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href="https://melinux.net">
                <Home className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </Button>
            
            <p className="text-sm text-muted-foreground mt-4">
              Changed your mind? You can always try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
