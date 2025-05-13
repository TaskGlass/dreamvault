import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-20 flex flex-col items-center text-center">
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-400">
          Unlock the Secrets of
          <br />
          Your Dreams
        </h1>
        <p className="text-xl text-muted-foreground max-w-xl mx-auto">
          DreamVault uses AI to interpret your dreams, revealing hidden meanings and emotional insights.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          >
            <Link href="/signup">Get Started Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full border-purple-300/20 backdrop-blur-sm">
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </div>

      <div className="relative mt-16 w-full max-w-lg">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 opacity-75 blur"></div>
        <div className="relative rounded-2xl overflow-hidden border border-purple-300/20 backdrop-blur-sm bg-background/80">
          <img
            src="/images/dream-interface.jpeg"
            alt="DreamVault dream interpretation interface"
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  )
}
