import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, BookOpen, BarChart3, Calendar, Sparkles, Compass } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI Dream Interpretation",
    description: "Get detailed interpretations of your dreams with emotional insights and recommendations.",
  },
  {
    icon: BookOpen,
    title: "Dream Journal",
    description: "Log and revisit your dreams anytime, building a personal dream history.",
  },
  {
    icon: BarChart3,
    title: "Insights Dashboard",
    description: "Track mood patterns, recurring themes, and dream statistics over time.",
  },
  {
    icon: Calendar,
    title: "Dream Patterns",
    description: "Identify recurring patterns in your dreams and track how they change over time.",
  },
  {
    icon: Sparkles,
    title: "AI Affirmations",
    description: "Receive personalized affirmations connected to each dream interpretation.",
  },
  {
    icon: Compass,
    title: "Horoscope Integration",
    description: "See how your dreams connect to your daily horoscope and astrological influences.",
  },
]

export function FeatureSection() {
  return (
    <section id="features" className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">Powerful Dream Analysis Features</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover the meaning behind your dreams with our comprehensive suite of tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="border border-purple-300/20 backdrop-blur-sm bg-background/80">
            <CardHeader>
              <feature.icon className="h-10 w-10 text-purple-500 mb-2" />
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
