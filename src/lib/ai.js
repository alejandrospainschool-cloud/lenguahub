const GEMINI_API_KEY = "AIzaSyCZcEsfkUpTRijrfLTWDvojCFi6n7w35zM";

export const generateContent = async (prompt) => {
  if (!GEMINI_API_KEY) return 'Missing API key';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await res.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No response'
    );
  } catch (e) {
    return 'AI request failed';
  }
};
