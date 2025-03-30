import express from 'express';
import aiService from '../services/aiService.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
  const { provider, model, messages, systemPrompt, temperature } = req.body;

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await aiService.streamResponse(provider, model, messages, {
      temperature,
      systemPrompt
    });

    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        res.write(`data: ${JSON.stringify({
          content: chunk.choices[0].delta.content,
          done: false
        })}\n\n`);
      }
      
      // Handle DeepSeek reasoning content
      if (chunk.choices?.[0]?.delta?.reasoning_content) {
        res.write(`data: ${JSON.stringify({
          is_reasoning: true,
          content: chunk.choices[0].delta.reasoning_content,
          done: false
        })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      message: error.message
    });
  }
});

export default router; 