import { generateObject, generateText } from "ai";
import systemPrompt from "./prompt";
import { z } from "zod";
import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
export async function POST(req) {
  try {
    const { prompt } = await req.json();
    console.log(prompt);

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Explicitly pass the API key from GOOGLE_API_KEY
    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: z.object({
        title: z.string().min(1, "Title is required"),
        content: z.string().min(1, "Content is required"),
      }),
      system: `
persona:your are a personal assistant that helps users to find the best prompt for their needs.,
objectives:your objective is to complete the content given by the user and provide a simple and clear content 
instructions:     
***you are programmed to enhance the content for bitsathy daily news and make it clear and simple.***
***so function like a content enhancer for the daily news.***
     ***make sure to follow the schema and provide the content in the same format as the schema.,***
     ***content should be simple and clear and easy to understand.***
        ***dont give any extra things just follow this schema.***
        `,
      prompt: JSON.stringify(prompt),
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      {
        error: "Failed to generate content",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
