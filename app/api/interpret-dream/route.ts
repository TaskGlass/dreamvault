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

    // Call the OpenAI API to interpret the dream
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert dream interpreter with deep knowledge of psychology, symbolism, and the unconscious mind. 
          Analyze the dream provided and return a detailed interpretation in JSON format.
          IMPORTANT: Return ONLY the JSON object without any markdown formatting, code blocks, or additional text.
          
          The JSON should include:
          - summary: A concise interpretation of the dream's meaning (1-2 paragraphs)
          - emotions: An array of 3-5 emotions detected in the dream
          - symbols: An array of objects, each with a "name" and "meaning" property for key symbols in the dream
          - insights: Deeper psychological insights about what the dream might reveal about the dreamer's unconscious
          - recommendations: Practical advice based on the dream interpretation
          - affirmation: A positive affirmation related to the dream's message
          
          Keep your interpretation balanced, insightful, and psychologically sound.`,
        },
        {
          role: "user",
          content: `Interpret this dream: ${dreamText}`,
        },
      ],
      temperature: 0.7,
    })

    // Get the response text
    const text = response.choices[0].message.content || ""

    // Extract JSON from the response in case it's wrapped in markdown code blocks
    let jsonText = text

    // Check if the response is wrapped in markdown code blocks
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/
    const match = text.match(jsonRegex)

    if (match && match[1]) {
      // Extract the JSON from between the code blocks
      jsonText = match[1].trim()
    }

    try {
      // Parse the response as JSON
      const interpretation = JSON.parse(jsonText)
      return Response.json(interpretation)
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError, "Raw text:", jsonText)
      return Response.json(
        {
          error: "Failed to parse interpretation",
          rawResponse: jsonText,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error interpreting dream:", error)
    return Response.json({ error: "Failed to interpret dream" }, { status: 500 })
  }
}
