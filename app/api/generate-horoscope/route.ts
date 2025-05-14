import { OpenAI } from "openai"
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper function to get zodiac sign from birthday
function getZodiacSign(birthday: string): string {
  try {
    const date = new Date(birthday)
    if (isNaN(date.getTime())) {
      console.error("Invalid birthday format:", birthday)
      return "Unknown"
    }

    const month = date.getMonth() + 1 // getMonth() returns 0-11
    const day = date.getDate()

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries"
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus"
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini"
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer"
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo"
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo"
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra"
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio"
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius"
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn"
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius"
    return "Pisces" // Feb 19 - Mar 20
  } catch (error) {
    console.error("Error determining zodiac sign:", error)
    return "Unknown"
  }
}

export async function POST(request: Request) {
  try {
    // Get the dream text, interpretation, and user ID from the request body
    const { dreamText, interpretation, userId } = await request.json()

    if (!dreamText && !interpretation) {
      return NextResponse.json({ error: "Dream text or interpretation is required" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is not configured")
      return NextResponse.json(
        {
          error: "OpenAI API key is not configured",
          message: "The server is not properly configured to generate horoscopes.",
        },
        { status: 500 },
      )
    }

    console.log("Fetching user profile for userId:", userId)

    // Get user's birthday from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("birthday")
      .eq("user_id", userId)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json(
        {
          error: "Could not retrieve profile",
          message: "Error fetching user profile: " + profileError.message,
        },
        { status: 400 },
      )
    }

    if (!profile || !profile.birthday) {
      console.error("No birthday found in profile:", profile)
      return NextResponse.json(
        {
          error: "Birthday not found",
          message: "Please make sure your birthday is set in your profile.",
        },
        { status: 400 },
      )
    }

    console.log("Retrieved birthday:", profile.birthday)

    // Get zodiac sign from birthday
    const zodiacSign = getZodiacSign(profile.birthday)
    console.log("Determined zodiac sign:", zodiacSign)

    if (zodiacSign === "Unknown") {
      return NextResponse.json(
        {
          error: "Invalid birthday format",
          message: "Could not determine zodiac sign from birthday.",
        },
        { status: 400 },
      )
    }

    // Create a prompt for the horoscope interpretation
    const prompt = `Generate a personalized horoscope interpretation that connects the user's dream with their zodiac sign. 
    
    Zodiac Sign: ${zodiacSign}
    Dream: ${dreamText.substring(0, 500)}
    
    The interpretation should include:
    1. A brief daily horoscope for ${zodiacSign}
    2. How the dream themes connect to current astrological influences
    3. What the dream might be revealing about the user's current life path
    4. Advice based on both the dream content and astrological position
    
    Format the response as JSON with the following structure:
    {
      "dailyHoroscope": "General horoscope for ${zodiacSign} today",
      "dreamConnection": "How the dream connects to their zodiac sign",
      "cosmicInsight": "Deeper astrological interpretation of the dream",
      "advice": "Guidance based on both dream and stars"
    }
    
    Keep the tone positive, insightful, and empowering.`

    console.log("Sending request to OpenAI")

    try {
      // Call the OpenAI API to generate the horoscope interpretation
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert astrologer who specializes in connecting dreams with astrological insights. Provide thoughtful, personalized interpretations that blend dream analysis with zodiac wisdom.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      })

      // Get the horoscope interpretation
      const horoscopeText = response.choices[0]?.message.content

      if (!horoscopeText) {
        console.error("No response from OpenAI")
        return NextResponse.json({ error: "No horoscope was generated" }, { status: 500 })
      }

      console.log("Received response from OpenAI:", horoscopeText.substring(0, 100) + "...")

      // Parse the JSON response
      try {
        const horoscope = JSON.parse(horoscopeText)
        return NextResponse.json({ horoscope, zodiacSign })
      } catch (parseError) {
        console.error("Error parsing horoscope JSON:", parseError)
        return NextResponse.json(
          {
            error: "Invalid horoscope format",
            rawResponse: horoscopeText,
          },
          { status: 500 },
        )
      }
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)

      // Return a more specific error message for OpenAI API errors
      return NextResponse.json(
        {
          error: "OpenAI API error",
          message: openaiError.message || "Failed to generate horoscope using OpenAI",
          details: openaiError.toString(),
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error generating horoscope:", error)

    // Ensure we always return a proper JSON response
    return NextResponse.json(
      {
        error: "Failed to generate horoscope",
        message: error.message || "Unknown error",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
