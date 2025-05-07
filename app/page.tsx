import { HeroSection } from "@/components/hero-section"
import { FeatureSection } from "@/components/feature-section"
import { PricingSection } from "@/components/pricing-section"
import { MobileNav } from "@/components/mobile-nav"

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-background/80 to-background">
      <div className="w-full px-4 sm:px-6 md:px-8 mx-auto">
        <MobileNav />

        <HeroSection />

        <FeatureSection />

        <PricingSection />

        <footer className="py-12 text-center text-muted-foreground">
          <p>© 2025 DreamVault. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}
