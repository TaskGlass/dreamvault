import { OpenAI } from "openai"
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getZodiacSign, checkBirthdayColumn } from "@/lib/dream-service"

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    console.log("Horoscope generation API called")

    // Get the request body
    const body = await request.json()
    console.log("Request body:", JSON.stringify(body))

    const { dreamText, interpretation, userId } = body

    // Validate required parameters
    if (!dreamText) {
      console.error("Missing dreamText parameter")
      return NextResponse.json({ error: "Dream text is required" }, { status: 400 })
    }

    if (!userId) {
      console.error("Missing userId parameter")
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

    console.log("Checking birthday column existence")
    // Check if birthday column exists
    const birthdayColumnExists = await checkBirthdayColumn()

    if (!birthdayColumnExists) {
      console.error("Birthday column does not exist in profiles table")
      return NextResponse.json(
        {
          error: "Birthday column does not exist",
          message: "The birthday column is missing from the profiles table. Please run the migration to add it.",
        },
        { status: 400 },
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

    console.log("Profile data:", JSON.stringify(profile))

    if (!profile) {
      console.error("No profile found for user:", userId)
      return NextResponse.json(
        {
          error: "Profile not found",
          message: "No profile found for this user.",
        },
        { status: 400 },
      )
    }

    if (!profile.birthday) {
      console.error("No birthday found in profile for user:", userId)
      return NextResponse.json(
        {
          error: "Birthday not found",
          message: "Please set your birthday in your profile settings.",
        },
        { status: 400 },
      )
    }

    console.log("Retrieved birthday:", profile.birthday)

    // Get zodiac sign from birthday
    const zodiacSign = getZodiacSign(profile.birthday)
    console.log("Determined zodiac sign:", zodiacSign)

    if (!zodiacSign) {
      console.error("Could not determine zodiac sign from birthday:", profile.birthday)
      return NextResponse.json(
        {
          error: "Invalid birthday format",
          message: "Could not determine zodiac sign from birthday.",
        },
        { status: 400 },
      )
    }

    // Create a simplified dream text for the prompt
    const simplifiedDreamText = dreamText.substring(0, 500).replace(/"/g, "'")

    // Create a prompt for the horoscope interpretation
    const prompt = `Generate a personalized horoscope interpretation that connects the user's dream with their zodiac sign. 
    
    Zodiac Sign: ${zodiacSign}
    Dream: ${simplifiedDreamText}
    
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

    console.log("Sending request to OpenAI with prompt:", prompt.substring(0, 100) + "...")

    try {
      // Call the OpenAI API to generate the horoscope interpretation
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Fallback to a more reliable model
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

        // Validate the response structure
        if (!horoscope.dailyHoroscope || !horoscope.dreamConnection || !horoscope.cosmicInsight || !horoscope.advice) {
          console.error("Invalid horoscope format - missing required fields")

          // Create a fallback horoscope with the data we have
          const fallbackHoroscope = {
            dailyHoroscope:
              horoscope.dailyHoroscope || `As a ${zodiacSign}, today brings opportunities for reflection and growth.`,
            dreamConnection: horoscope.dreamConnection || "Your dream reflects your current astrological position.",
            cosmicInsight:
              horoscope.cosmicInsight ||
              "The cosmic energies are aligning to help you understand your subconscious better.",
            advice:
              horoscope.advice ||
              "Take time to reflect on the symbols in your dream and how they relate to your current life path.",
          }

          return NextResponse.json({
            horoscope: fallbackHoroscope,
            zodiacSign,
            note: "Some fields were missing from the AI response and have been filled with defaults.",
          })
        }

        return NextResponse.json({ horoscope, zodiacSign })
      } catch (parseError) {
        console.error("Error parsing horoscope JSON:", parseError)
        console.error("Raw response:", horoscopeText)

        // Create a manual fallback horoscope
        const fallbackHoroscope = {
          dailyHoroscope: `As a ${zodiacSign}, today brings opportunities for reflection and growth.`,
          dreamConnection:
            "Your dream contains symbols that connect to your zodiac sign's current astrological position.",
          cosmicInsight: "The cosmic energies are aligning to help you understand your subconscious better.",
          advice: "Take time to reflect on the symbols in your dream and how they relate to your current life path.",
        }

        return NextResponse.json({
          horoscope: fallbackHoroscope,
          zodiacSign,
          note: "There was an error parsing the AI response. A default horoscope has been provided.",
        })
      }
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)

      // Create a fallback horoscope
      const fallbackHoroscope = {
        dailyHoroscope: `As a ${zodiacSign}, today brings opportunities for reflection and growth.`,
        dreamConnection:
          "Your dream contains symbols that connect to your zodiac sign's current astrological position.",
        cosmicInsight: "The cosmic energies are aligning to help you understand your subconscious better.",
        advice: "Take time to reflect on the symbols in your dream and how they relate to your current life path.",
      }

      // Return a more specific error message for OpenAI API errors
      return NextResponse.json({
        horoscope: fallbackHoroscope,
        zodiacSign,
        error: "OpenAI API error",
        message: openaiError.message || "Failed to generate horoscope using OpenAI",
        note: "A default horoscope has been provided due to an error with the AI service.",
      })
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
