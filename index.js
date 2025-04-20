const express = require('express');
const cors = require('cors');
const { AssemblyAI } = require('assemblyai');

const app = express();

// Enable CORS for all origins
app.use(cors()); // 👈 This allows requests from any website
app.use(express.json());

// AssemblyAI setup
const client = new AssemblyAI({
  apiKey:process.env.KEY|| '5a67904c1d1748228c3030839d0ea6fb',
  timeout: 60000,
});

// Emergency keyword detection
function detectEmergency(transcript) {
  const dangerWords = ['help', 'fire', 'accident', 'emergency', 'bleeding'];
  return dangerWords.some(word => transcript.toLowerCase().includes(word));
}

// Handle Exotel Passthru request
app.post('/analyze-call', async (req, res) => {
  try {
    const { CallSid, From, To, RecordingUrl } = req.body;

    console.log(`📞 Call from ${From}`);
    console.log(`🔊 Recording URL: ${RecordingUrl}`);

    const config = { audio_url: RecordingUrl };
    const transcript = await client.transcripts.transcribe(config);
    console.log(`📝 Transcript: ${transcript.text}`);

    const isEmergency = detectEmergency(transcript.text);
    if (isEmergency) {
      console.log(`🚨 Emergency detected for CallSid ${CallSid}`);
    } else {
      console.log(`✅ No emergency for CallSid ${CallSid}`);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).send('Internal Server Error');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
