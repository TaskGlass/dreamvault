import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Dreamer Lite",
    tagline: "Free",
    price: "$0",
    period: "month",
    description: "Perfect for casual dream explorers",
    features: [
      "5 dreams per month",
      "Basic text interpretation",
      "Save dreams",
      "72h email support",
    ],
    cta: "Get Started",
    href: "/signup?plan=free",
    highlight: false,
  },
  {
    name: "Lucid Explorer",
    tagline: "Starter",
    price: "$9",
    period: "month",
    description: "For those seeking deeper dream insights",
    features: [
      "15 dreams per month",
      "Mood & emotion insights",
      "Personalized affirmations",
      "Daily horoscope integration",
      "24h support",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=starter",
    highlight: true,
  },
  {
    name: "Astral Voyager",
    tagline: "Pro",
    price: "$19",
    period: "month",
    description: "The complete dream analysis experience",
    features: [
      "30 dreams per month",
      "Weekly dream summaries",
      "Shareable reports",
      "Advanced horoscope analysis",
      "All Starter features",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/signup?plan=pro",
    highlight: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">Choose Your Dream Journey</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select the plan that best fits your dream exploration needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <Card
            key={index}
            className={`border ${plan.highlight ? "border-purple-500/50" : "border-purple-300/20"} backdrop-blur-sm bg-background/80 relative overflow-hidden flex flex-col`}
          >
            {plan.highlight && (
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            )}
            <CardHeader>
              <div className="text-sm font-medium text-muted-foreground">{plan.tagline}</div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="flex items-baseline mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="ml-1 text-muted-foreground">/{plan.period}</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="h-4 w-4 text-purple-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                asChild
                className={`w-full rounded-full ${plan.highlight ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" : ""}`}
                variant={plan.highlight ? "default" : "outline"}
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
