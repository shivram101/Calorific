// routes/ai.js
// Endpoint: POST /api/ai/identify-food
//
// Accepts a base64-encoded food image, sends it to Claude's vision API,
// and returns structured nutrition estimates. Requires ANTHROPIC_API_KEY
// in the environment. Used for the AI food photo recognition feature.

const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const PROMPT = `You are a professional nutritionist and food recognition expert analyzing a photo.

Identify the food(s) in this image and estimate the nutritional content for a realistic single serving.

Rules:
- Be specific with the food name (e.g. "Grilled Chicken Breast" not "Chicken")
- If you see a full meal with multiple components, name the overall dish
- Base serving size estimates on standard restaurant/home portions you can see
- If the image is unclear or no food is visible, return the error format

Respond with ONLY a raw JSON object — no markdown, no backticks, no explanation:

{
  "name": "Specific food name",
  "servingSize": 100,
  "servingSizeUnit": "g",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "confidence": 0.85,
  "description": "One sentence describing what you see in the image"
}

If no food is detected or the image is unrecognizable:
{"error": "Could not identify food in this image"}`;

// ---------- POST /api/ai/identify-food ----------
router.post('/ai/identify-food', requireAuth, async (req, res) => {
  try {
    const { imageBase64, mediaType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'AI service is not configured (missing ANTHROPIC_API_KEY)' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error('Claude API error:', errBody);
      return res.status(502).json({ error: 'AI service returned an error' });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text ?? '';

    let result;
    try {
      // Strip any accidental markdown fences before parsing
      result = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    } catch {
      console.error('Failed to parse Claude response:', rawText);
      return res.status(502).json({ error: 'AI returned an unparseable response' });
    }

    if (result.error) {
      return res.status(422).json({ error: result.error });
    }

    // Coerce all numeric fields so the frontend can use them directly
    return res.status(200).json({
      name:            String(result.name || 'Unknown food'),
      servingSize:     Number(result.servingSize) || 100,
      servingSizeUnit: String(result.servingSizeUnit || 'g'),
      calories:        Math.round(Number(result.calories) || 0),
      protein:         Math.round(Number(result.protein)  || 0),
      carbs:           Math.round(Number(result.carbs)    || 0),
      fat:             Math.round(Number(result.fat)      || 0),
      confidence:      Number(result.confidence)           || 0,
      description:     String(result.description || ''),
    });
  } catch (err) {
    console.error('Identify food error:', err);
    return res.status(500).json({ error: 'Server error during food identification' });
  }
});

module.exports = router;
