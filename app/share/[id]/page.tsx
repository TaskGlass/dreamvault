"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSharedContent } from "@/lib/dream-service"
import { Sparkles, Download, ArrowLeft, Share2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function SharePage() {
  const params = useParams()
  const { toast } = useToast()
  const [sharedContent, setSharedContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSharedContent() {
      if (!params.id) return

      try {
        const { data, error } = await getSharedContent(params.id as string)

        if (error) {
          setError("The shared content could not be found or has expired.")
        } else {
          setSharedContent(data)
        }
      } catch (err) {
        setError("An error occurred while loading the shared content.")
      } finally {
        setLoading(false)
      }
    }

    fetchSharedContent()
  }, [params.id])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link copied",
      description: "The share link has been copied to your clipboard.",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background/80 to-background">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 opacity-75 blur-sm"></div>
          <div className="absolute inset-3 rounded-full bg-background"></div>
        </div>
        <p className="text-muted-foreground mt-4">Loading shared content...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background/80 to-background">
        <Card className="w-full max-w-md border border-purple-300/20 backdrop-blur-sm bg-background/80">
          <CardHeader>
            <CardTitle>Content Not Found</CardTitle>
            <CardDescription>The shared content could not be loaded</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!sharedContent) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background/80 to-background">
      <div className="w-full max-w-3xl">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>

        {sharedContent.share_type === "artwork" && (
          <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            <CardHeader>
              <CardTitle>{sharedContent.title || "Dream Artwork"}</CardTitle>
              <CardDescription>AI-generated visualization of a dream</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="relative w-full max-w-2xl mx-auto">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 opacity-75 blur"></div>
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={sharedContent.content || "/placeholder.svg"}
                    alt="AI-generated dream artwork"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-2 border-t border-border/50 p-4">
              <Button variant="outline" size="sm" className="gap-1" onClick={handleCopyLink}>
                <Share2 className="h-3.5 w-3.5" />
                <span>Copy Link</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1" asChild>
                <a href={sharedContent.content} download="dream-artwork.jpg" target="_blank" rel="noopener noreferrer">
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              </Button>
            </CardFooter>
          </Card>
        )}

        {sharedContent.share_type === "affirmation" && (
          <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            <CardHeader>
              <CardTitle>{sharedContent.title || "Dream Affirmation"}</CardTitle>
              <CardDescription>Personalized affirmation based on a dream</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="relative max-w-md mx-auto text-center">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 opacity-75 blur"></div>
                <div className="relative rounded-lg p-8 border border-purple-300/20 backdrop-blur-sm bg-background/80">
                  <Sparkles className="h-6 w-6 text-purple-500 mx-auto mb-4" />
                  <p className="text-xl font-medium italic">"{sharedContent.content}"</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-2 border-t border-border/50 p-4">
              <Button variant="outline" size="sm" className="gap-1" onClick={handleCopyLink}>
                <Share2 className="h-3.5 w-3.5" />
                <span>Copy Link</span>
              </Button>
            </CardFooter>
          </Card>
        )}

        {sharedContent.share_type === "dream" && (
          <Card className="border border-purple-300/20 backdrop-blur-sm bg-background/80 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
            <CardHeader>
              <CardTitle>{sharedContent.title || "Shared Dream"}</CardTitle>
              <CardDescription>A dream that was shared with you</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{sharedContent.content}</p>
            </CardContent>
            <CardFooter className="flex justify-center gap-2 border-t border-border/50 p-4">
              <Button variant="outline" size="sm" className="gap-1" onClick={handleCopyLink}>
                <Share2 className="h-3.5 w-3.5" />
                <span>Copy Link</span>
              </Button>
            </CardFooter>
          </Card>
        )}

        <div className="text-center text-xs text-muted-foreground mt-6">
          <p>
            Shared via{" "}
            <Link href="/" className="text-purple-500 hover:underline">
              DreamVault
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
