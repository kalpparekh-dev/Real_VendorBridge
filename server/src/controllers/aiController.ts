import { Response } from 'express';
import { z } from 'zod';
import { getAIProcurementAnswer } from '../services/ai.service';

const aiChatSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(500, 'Message is too long'),
});

export const chatWithAI = async (req: any, res: Response) => {
  try {
    const { message } = aiChatSchema.parse(req.body);

    const startedAt = Date.now();

    const answer = await getAIProcurementAnswer(message);

    const responseTime = Date.now() - startedAt;

    res.status(200).json({
      success: true,
      data: {
        question: message,
        answer,
        responseTimeMs: responseTime,
        generatedAt: new Date().toISOString(),
        assistant: 'VendorBridge AI',
        version: 'v3.0',
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors,
      });
    }

    console.error('AI Assistant Error:', error);

    return res.status(500).json({
      success: false,
      error: 'AI Assistant failed to process your request.',
      message:
        'Please try again in a few moments. If the issue persists, contact your administrator.',
      timestamp: new Date().toISOString(),
    });
  }
};