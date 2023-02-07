import { type NextRequest, NextResponse } from 'next/server';

// break the app if the API key is missing
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY');
}

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  // read body from request
  const body = await req.json();
  // const messages = req.body.messages
  const messagesPrompt = body.message;
  const finalPrompt = `"""
Generate 1 to 6 commits based on <Angular Conventional Commit> for "${messagesPrompt}";
Identify the scope if possible;
Use English and do not use upper case;
Return as a string list, use double-quotes for strings code;
"""
answer=
`;

  const payload = {
    model: 'text-davinci-003',
    prompt: finalPrompt,
    temperature: process.env.AI_TEMP ? parseFloat(process.env.AI_TEMP) : 0.7,
    max_tokens: process.env.AI_MAX_TOKENS
      ? parseInt(process.env.AI_MAX_TOKENS)
      : 200,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    user: body?.user,
  };

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  };

  if (process.env.OPENAI_API_ORG) {
    requestHeaders['OpenAI-Organization'] = process.env.OPENAI_API_ORG;
  }

  const response = await fetch('https://api.openai.com/v1/completions', {
    headers: requestHeaders,
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.error) {
    console.error('OpenAI API error: ', data.error);
    return NextResponse.json({
      text: `ERROR with API integration. ${data.error.message}`,
    });
  }

  try {
    JSON.stringify(data.choices[0].text);
    const e = { prompt: finalPrompt, completion: data.choices[0].text };
    console.log(e);
  } catch (e) {
    console.log(e);
  }

  // return response with 200 and stringify json text
  return NextResponse.json({ text: data.choices[0].text });
}
