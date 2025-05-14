import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getZodiacSign, checkBirthdayColumn } from "@/lib/dream-service"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { dreamId, dreamContent, userId } = await request.json()

    if (!dreamId || !dreamContent || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters: dreamId, dreamContent, or userId" },
        { status: 400 },
      )
    }

    console.log("Generating horoscope for dream:", dreamId)

    // Check if birthday column exists
    const birthdayColumnExists = await checkBirthdayColumn()

    if (!birthdayColumnExists) {
      return NextResponse.json(
        {
          error: "Birthday column does not exist in the database",
          message: "Please run the migration to add the birthday column",
        },
        { status: 400 },
      )
    }

    // Get user profile to retrieve birthday
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("birthday")
      .eq("user_id", userId)
      .single()

    if (profileError) {
      console.error("Error fetching user profile:", profileError)
      return NextResponse.json(
        { error: "Failed to fetch user profile", details: profileError.message },
        { status: 500 },
      )
    }

    if (!profile || !profile.birthday) {
      return NextResponse.json(
        { error: "User birthday not found. Please update your profile with your birthday." },
        { status: 400 },
      )
    }

    // Determine zodiac sign
    const zodiacSign = getZodiacSign(profile.birthday)

    if (!zodiacSign) {
      return NextResponse.json({ error: "Could not determine zodiac sign from birthday" }, { status: 400 })
    }

    console.log("User zodiac sign:", zodiacSign)

    // Generate horoscope using OpenAI
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `
          Dream content: "${dreamContent}"
          
          Zodiac sign: ${zodiacSign}
          
          Generate a personalized horoscope interpretation that connects this dream with the person's zodiac sign (${zodiacSign}).
          Explain how the dream symbols and themes relate to current astrological influences for ${zodiacSign}.
          Include insights about what this dream might be revealing about their current life path based on their astrological profile.
          Provide guidance on how they can use this dream insight in conjunction with their zodiac traits.
          
          Format the response in JSON with the following structure:
          {
            "zodiacSign": "${zodiacSign}",
            "horoscope": "The full horoscope text",
            "keyInsight": "A short key insight from the horoscope",
            "advice": "Practical advice based on the dream and zodiac sign"
          }
        `,
        system:
          "You are an expert dream interpreter and astrologer. Provide insightful, personalized horoscope interpretations that connect dream content with astrological influences. Be specific, thoughtful, and provide genuine value. Return only valid JSON.",
      })

      // Parse the response to ensure it's valid JSON
      let horoscopeData
      try {
        horoscopeData = JSON.parse(text)

        // Validate the structure
        if (
          !horoscopeData.zodiacSign ||
          !horoscopeData.horoscope ||
          !horoscopeData.keyInsight ||
          !horoscopeData.advice
        ) {
          throw new Error("Response missing required fields")
        }
      } catch (parseError) {
        console.error("Error parsing horoscope response:", parseError)
        console.error("Raw response:", text)
        return NextResponse.json({ error: "Failed to parse horoscope response", details: parseError }, { status: 500 })
      }

      return NextResponse.json(horoscopeData)
    } catch (aiError) {
      console.error("Error generating horoscope with AI:", aiError)
      return NextResponse.json({ error: "Failed to generate horoscope", details: aiError }, { status: 500 })
    }
  } catch (error) {
    console.error("Unexpected error in generate-horoscope:", error)
    return NextResponse.json({ error: "An unexpected error occurred", details: error }, { status: 500 })
  }
}
