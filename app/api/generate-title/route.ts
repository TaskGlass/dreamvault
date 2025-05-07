import { OpenAI } from "openai"
import { NextResponse } from "next/server"

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    // Get the dream text from the request body
    const { dreamText } = await request.json()

    if (!dreamText) {
      return NextResponse.json({ error: "Dream text is required" }, { status: 400 })
    }

    // Call the OpenAI API to generate a title
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a dream title generator. Generate a short, evocative title (5 words or less) for the dream described. 
          Return ONLY the title without quotes, explanations, or additional text.`,
        },
        {
          role: "user",
          content: `Generate a title for this dream: ${dreamText.substring(0, 500)}...`,
        },
      ],
      temperature: 0.7,
      max_tokens: 20,
    })

    // Get the response text
    const title = response.choices[0].message.content?.trim() || "Untitled Dream"

    return NextResponse.json({ title })
  } catch (error) {
    console.error("Error generating title:", error)
    return NextResponse.json({ error: "Failed to generate title", title: "Untitled Dream" }, { status: 500 })
  }
}
