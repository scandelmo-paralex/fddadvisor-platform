import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>We've sent you a confirmation link to verify your email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Next steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Check your email inbox</li>
              <li>Click the confirmation link</li>
              <li>Return here to sign in</li>
            </ol>
          </div>

          <Button asChild className="w-full">
            <Link href="/login">Go to Sign In</Link>
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Didn't receive an email? Check your spam folder
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
