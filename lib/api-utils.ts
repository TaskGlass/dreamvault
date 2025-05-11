import { NextResponse } from "next/server"

export function handleApiError(error: any) {
  console.error("API Error:", error)

  if (error.message?.includes("Service Role Key is missing")) {
    return NextResponse.json(
      {
        error: "Server configuration error",
        message: "The server is not properly configured. Please contact the administrator.",
      },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { error: "Internal server error", message: error.message || "An unexpected error occurred" },
    { status: 500 },
  )
}
