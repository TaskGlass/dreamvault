# DreamVault - AI Dream Interpretation SaaS

DreamVault is a mobile-first web application that uses OpenAI's ChatGPT API to analyze users' dreams, providing interpretations, emotional insights, and recommendations.

## Features

- AI dream interpretation
- Dream journal
- Insights dashboard
- Voice input (Pro plan)
- AI-generated affirmations
- AI-generated dream art
- Subscription plans

## Tech Stack

- Next.js (App Router)
- Supabase (Authentication & Database)
- OpenAI API (ChatGPT)
- shadcn/ui (UI Components)
- Tailwind CSS (Styling)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
\`\`\`

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

1. Create a new Supabase project
2. Run the SQL migration in `supabase/migrations/20250505_initial_schema.sql`

## Subscription Plans

- **Dreamer Lite (Free)**: $0/month - 5 dreams/mo, basic text interpretation, save dreams, 72h email support
- **Lucid Explorer (Starter)**: $9/month - 15 dreams/mo, mood + emotion insights, affirmations, AI art, 24h support
- **Astral Voyager (Pro)**: $19/month - 30 dreams/mo, voice input + transcription, weekly dream summaries, shareable reports, all Starter features

## License

This project is licensed under the MIT License.
