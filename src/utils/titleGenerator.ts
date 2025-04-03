import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const SYSTEM_PROMPT = `You are a highly efficient chat title generator. Your only job is to create a brief, relevant title (maximum 5 words) based on the first message exchange in a conversation. Be concise and capture the essence. Respond ONLY with the title, nothing else. Prefer shorter titles over longer ones. Do not use quotes or punctuation.`;

export const generateChatTitle = async (userMessage: string, aiResponse: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse }
      ],
      temperature: 0.7,
      max_tokens: 20,
    });

    const title = completion.choices[0]?.message?.content?.trim() || 'New Chat';
    return title;
  } catch (error) {
    console.error('Error generating chat title:', error);
    return 'New Chat';
  }
}; 