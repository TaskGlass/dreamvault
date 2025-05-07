import { OpenAI } from "openai"
import { NextResponse } from "next/server"

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    // Get the dream text and interpretation from the request body
    const { dreamText, interpretation } = await request.json()

    if (!dreamText && !interpretation) {
      return NextResponse.json({ error: "Dream text or interpretation is required" }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is not configured")
      return NextResponse.json(
        {
          error: "OpenAI API key is not configured",
          message: "The server is not properly configured to generate images.",
        },
        { status: 500 },
      )
    }

    // Create a prompt that ensures positive, calming imagery
    let prompt = "Create a beautiful, positive, calming dream artwork. "

    // Use the interpretation if available for more context
    if (interpretation && interpretation.summary) {
      prompt += `The dream is about: ${interpretation.summary} `
    } else {
      // Otherwise use the dream text
      prompt += `The dream is about: ${dreamText.substring(0, 300)} `
    }

    // Add specific instructions to ensure appropriate content
    prompt +=
      "Make the image serene, peaceful, and uplifting. Use soft colors and gentle imagery. Avoid any disturbing, scary, or negative elements. Create a dreamy, ethereal quality with positive symbolism."

    // Add symbols from interpretation if available
    if (interpretation && interpretation.symbols && interpretation.symbols.length > 0) {
      const symbolNames = interpretation.symbols.map((s: any) => s.name).join(", ")
      prompt += ` Include these elements if possible: ${symbolNames}.`
    }

    try {
      // Call the OpenAI API to generate an image
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural",
      })

      // Get the image URL
      const imageUrl = response.data[0]?.url

      if (!imageUrl) {
        return NextResponse.json({ error: "No image was generated" }, { status: 500 })
      }

      return NextResponse.json({ imageUrl })
    } catch (openaiError: any) {
      console.error("OpenAI API error:", openaiError)

      // Return a more specific error message for OpenAI API errors
      return NextResponse.json(
        {
          error: "OpenAI API error",
          message: openaiError.message || "Failed to generate image using OpenAI",
          details: openaiError.toString(),
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error generating artwork:", error)

    // Ensure we always return a proper JSON response
    return NextResponse.json(
      {
        error: "Failed to generate artwork",
        message: error.message || "Unknown error",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
