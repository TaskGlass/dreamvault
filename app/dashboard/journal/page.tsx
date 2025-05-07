"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DreamCard } from "@/components/dream-card"
import { Plus, Search, Loader2, Calendar, Tag, SlidersHorizontal, BookOpen } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { getDreamsByUserId, type Dream } from "@/lib/dream-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function JournalPage() {
  const { user } = useAuth()
  const [dreams, setDreams] = useState<Dream[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function fetchDreams() {
      if (!user) return

      try {
        const userDreams = await getDreamsByUserId(user.id)
        setDreams(userDreams)
      } catch (error) {
        console.error("Error fetching dreams:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDreams()
  }, [user])

  // Get all unique moods and tags
  const allMoods = Array.from(new Set(dreams.map((dream) => dream.mood).filter(Boolean)))
  const allTags = Array.from(new Set(dreams.flatMap((dream) => dream.tags || []).filter(Boolean)))

  // Filter dreams based on search term, mood, and tag
  const filteredDreams = dreams.filter((dream) => {
    const matchesSearch =
      dream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dream.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dream.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesMood = !selectedMood || dream.mood === selectedMood
    const matchesTag = !selectedTag || dream.tags?.includes(selectedTag)

    return matchesSearch && matchesMood && matchesTag
  })

  // Sort dreams
  const sortedDreams = [...filteredDreams].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (sortBy === "title") {
      return a.title.localeCompare(b.title)
    }
    return 0
  })

  const clearFilters = () => {
    setSelectedMood(null)
    setSelectedTag(null)
    setSearchTerm("")
  }

  return (
    <div className="w-full space-y-6 px-0 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dream Journal</h1>
          <p className="text-muted-foreground mt-1">
            {dreams.length > 0
              ? `You've recorded ${dreams.length} dream${dreams.length > 1 ? "s" : ""}`
              : "Start recording your dreams to build your journal"}
          </p>
        </div>
        <Button
          className="w-full sm:w-auto rounded-full gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-md shadow-purple-500/10"
          asChild
        >
          <Link href="/dashboard/interpret">
            <Plus className="h-4 w-4" />
            New Dream
          </Link>
        </Button>
      </div>

      <Card className="w-full border border-purple-300/20 backdrop-blur-sm bg-background/80">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-purple-500" />
              Search & Filter
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search dreams..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {allMoods.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Loader2 className="h-4 w-4" />
                    Filter by Mood
                  </label>
                  <Select value={selectedMood || ""} onValueChange={(value) => setSelectedMood(value || null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All moods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All moods</SelectItem>
                      {allMoods.map((mood) => (
                        <SelectItem key={mood} value={mood}>
                          {mood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {allTags.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    Filter by Tag
                  </label>
                  <Select value={selectedTag || ""} onValueChange={(value) => setSelectedTag(value || null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tags</SelectItem>
                      {allTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {(selectedMood || selectedTag || searchTerm) && (
            <div className="flex items-center gap-2 pt-2">
              <div className="text-sm text-muted-foreground">Active filters:</div>
              <div className="flex flex-wrap gap-2">
                {selectedMood && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Mood: {selectedMood}
                    <button className="ml-1 hover:text-foreground" onClick={() => setSelectedMood(null)}>
                      ×
                    </button>
                  </Badge>
                )}
                {selectedTag && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Tag: {selectedTag}
                    <button className="ml-1 hover:text-foreground" onClick={() => setSelectedTag(null)}>
                      ×
                    </button>
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    Search: {searchTerm}
                    <button className="ml-1 hover:text-foreground" onClick={() => setSearchTerm("")}>
                      ×
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 opacity-75 blur-sm"></div>
            <div className="absolute inset-3 rounded-full bg-background"></div>
          </div>
        </div>
      ) : sortedDreams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-0">
          {sortedDreams.map((dream) => (
            <DreamCard
              key={dream.id}
              dream={{
                id: dream.id,
                title: dream.title,
                date: new Date(dream.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
                summary: dream.content.substring(0, 120) + (dream.content.length > 120 ? "..." : ""),
                mood: dream.mood || "Unknown",
                tags: dream.tags || [],
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 space-y-4 mb-0">
          {dreams.length > 0 ? (
            <>
              <div className="rounded-full bg-purple-500/10 p-3 inline-flex">
                <Search className="h-6 w-6 text-purple-500" />
              </div>
              <p className="text-muted-foreground">No dreams match your search criteria</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-full bg-purple-500/10 p-3 inline-flex">
                <BookOpen className="h-6 w-6 text-purple-500" />
              </div>
              <p className="text-muted-foreground mb-4">No dreams found. Start recording your dreams!</p>
              <Button asChild>
                <Link href="/dashboard/interpret">Record Your First Dream</Link>
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
