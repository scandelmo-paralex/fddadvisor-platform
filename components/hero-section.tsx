import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-cta-muted/20">
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-cta hover:bg-cta-hover text-cta-foreground text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-approval text-approval hover:bg-approval hover:text-approval-foreground text-lg px-8 py-6 rounded-xl transition-all duration-300 hover:scale-105 bg-transparent"
            >
              Get Pre-Approved
              <CheckCircle className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
