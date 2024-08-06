const { NextResponse } = require("next/server");
import OpenAI from "openai";
import { ZAAVIS_SYSTEM_PROMPT } from "@/lib/prompts"

export async function POST(req) {
    console.log("You pinged POST /api/chat")
    // console.log(req.data) // undefined
    const data = await req.json()
    const userQuery = data.userQuery
    console.log(data)
    return NextResponse.json({
        message: "Hello from server!",
    })

    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
    })

    const completion = await openai.chat.completions.create({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
            {"role": "system", "content": ZAAVIS_SYSTEM_PROMPT},
            {"role": "user", "content": userQuery}
        ],
    })
    // console.log(completion.choices[0]);

    return NextResponse.json({
        chatbot: completion.choices[0].message
    })

    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
            try {
            // Iterate over the streamed chunks of the response
            for await (const chunk of completion) {
                const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
                if (content) {
                    const text = encoder.encode(content) // Encode the content to Uint8Array
                    controller.enqueue(text) // Enqueue the encoded text to the stream
                }
            }
            } catch (err) {
                controller.error(err) // Handle any errors that occur during streaming
            } finally {
                controller.close() // Close the stream when done
            }
        },
    })

    return new NextResponse(stream) // Return the stream as the response
}