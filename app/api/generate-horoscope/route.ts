import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getZodiacSign, checkBirthdayColumn } from "@/lib/dream-service"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { dreamId, dreamText, interpretation, userId } = await request.json()
    console.log("Received request with userId:", userId)

    if (!dreamText || !userId) {
      console.log("Missing required parameters:", { dreamText: !!dreamText, userId: !!userId })
      return NextResponse.json(
        { message: "Missing required parameters: dreamText and userId" },
        { status: 400 },
      )
    }

    // Check if birthday column exists
    const birthdayColumnExists = await checkBirthdayColumn()
    console.log("Birthday column exists:", birthdayColumnExists)
    if (!birthdayColumnExists) {
      return NextResponse.json(
        {
          message: "Birthday column does not exist in the database. Please run the migration to add the birthday column.",
        },
        { status: 400 },
      )
    }

    // Get user profile to retrieve birthday
    console.log("Fetching profile for user:", userId)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")  // Select all columns to see what we have
      .eq("user_id", userId)
      .single()

    if (profileError) {
      console.error("Error fetching user profile:", profileError)
      console.error("Error code:", profileError.code)
      console.error("Error message:", profileError.message)
      
      // If profile doesn't exist, create one
      if (profileError.code === 'PGRST116') {
        console.log("Profile not found, attempting to create one")
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            user_id: userId,
            subscription_tier: "free",
            dreams_count: 0,
            dreams_limit: 5,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()
        
        if (createError) {
          console.error("Error creating profile:", createError)
          console.error("Create error code:", createError.code)
          console.error("Create error message:", createError.message)
          return NextResponse.json(
            { message: "Please set your birthday in settings to generate horoscopes" },
            { status: 400 },
          )
        }

        console.log("New profile created:", newProfile)
        return NextResponse.json(
          { message: "Please set your birthday in settings to generate horoscopes" },
          { status: 400 },
        )
      }
      
      return NextResponse.json(
        { message: "Please set your birthday in settings to generate horoscopes" },
        { status: 400 },
      )
    }

    console.log("Profile found:", profile)
    if (!profile || !profile.birthday) {
      console.log("Profile exists but birthday is missing")
      return NextResponse.json(
        { message: "Please set your birthday in settings to generate horoscopes" },
        { status: 400 },
      )
    }

    // Determine zodiac sign
    const zodiacSign = getZodiacSign(profile.birthday)
    console.log("Zodiac sign determined:", zodiacSign)
    if (!zodiacSign) {
      return NextResponse.json(
        { message: "Could not determine zodiac sign from birthday" },
        { status: 400 },
      )
    }

    // Generate horoscope using OpenAI
    try {
      console.log("Generating horoscope with OpenAI")
      const { text } = await generateText({
        model: openai("gpt-4"),
        prompt: `
          Dream content: "${dreamText}"
          ${interpretation ? `Dream interpretation: ${JSON.stringify(interpretation)}` : ""}
          Zodiac sign: ${zodiacSign}
          Current date: ${new Date().toISOString().split('T')[0]}
          Generate a personalized horoscope interpretation that connects this dream with the person's zodiac sign (${zodiacSign}).
          Explain how the dream symbols and themes relate to current astrological influences for ${zodiacSign}.
          Include insights about what this dream might be revealing about their current life path based on their astrological profile.
          Provide guidance on how they can use this dream insight in conjunction with their zodiac traits.
          Format the response in JSON with the following structure:
          {
            "dailyHoroscope": "A general daily horoscope for ${zodiacSign}",
            "dreamConnection": "How this dream connects to your astrological profile",
            "cosmicInsight": "A deeper cosmic insight about the dream's meaning",
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
        console.log("Parsed horoscope data:", horoscopeData)
        
        // Validate the structure
        if (
          !horoscopeData.dailyHoroscope ||
          !horoscopeData.dreamConnection ||
          !horoscopeData.cosmicInsight ||
          !horoscopeData.advice
        ) {
          throw new Error("Response missing required fields")
        }

        // Save the horoscope to the dream record if dreamId is provided
        if (dreamId) {
          console.log("Saving horoscope to dream:", dreamId)
          const { error: updateError } = await supabase
            .from("dreams")
            .update({ horoscope: horoscopeData })
            .eq("id", dreamId)

          if (updateError) {
            console.error("Error saving horoscope to dream:", updateError)
            return NextResponse.json(
              { message: "Failed to save horoscope to dream" },
              { status: 500 },
            )
          }
        }

        return NextResponse.json({
          horoscope: horoscopeData,
          zodiacSign,
        })
      } catch (parseError: unknown) {
        console.error("Error parsing horoscope response:", parseError)
        console.error("Raw response:", text)
        return NextResponse.json(
          { message: "Failed to parse horoscope response" },
          { status: 500 },
        )
      }
    } catch (aiError: unknown) {
      console.error("Error generating horoscope with AI:", aiError)
      return NextResponse.json(
        { message: "Failed to generate horoscope" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Unexpected error in generate-horoscope:", error)
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
