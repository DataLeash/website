import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Updated to latest stable model
                messages: [
                    {
                        role: 'system',
                        content: `You are the DataLeash Security AI. 
            Your role is to answer questions about DataLeash, a high-security file sharing platform.
            
            Key Features of DataLeash to mention:
            - "Impossible Math" (4-Key Encryption via Shamir's Secret Sharing).
            - "The Kill Switch" (Instant global revocation).
            - "Ghost Execution" (Memory-only decryption, nothing on disk).
            - "Blackout Technology" (Anti-screenshot/recording).
            
            Tone: Professional, secure, slightly "cyberpunk" but helpful. Concise answers.
            Do not hallucinate features not mentioned above.`
                    },
                    ...messages
                ],
                temperature: 0.5,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to fetch from Groq');
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
