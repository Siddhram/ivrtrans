const express = require('express');
const cors = require('cors');
const { AssemblyAI } = require('assemblyai');

const app = express();

// Enable CORS for all origins
console.log('hi');
app.use(cors({
  origin: '*' // Allow all origins
}));
app.use(express.json());

// AssemblyAI setup
const client = new AssemblyAI({
  apiKey: '5a67904c1d1748228c3030839d0ea6fb',
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

    // Request transcription of the recorded call
    const config = { audio_url: RecordingUrl };
    const transcriptResponse = await client.transcripts.transcribe(config);

    // Wait for transcription to complete
    const transcriptId = transcriptResponse.id;
    let transcript = await client.transcripts.get(transcriptId);

    // Poll until transcription is ready
    while (transcript.status !== 'completed') {
      console.log('🕐 Waiting for transcription...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
      transcript = await client.transcripts.get(transcriptId);
    }

    console.log(`📝 Transcript: ${transcript.text}`);

    // Check for emergency keywords
    const isEmergency = detectEmergency(transcript.text);
    if (isEmergency) {
      console.log(`🚨 Emergency detected for CallSid ${CallSid}`);
      // Optionally, pass emergency flag to Exotel or update operator dashboard
      // Here, you would ideally set a flag to trigger a specific action (e.g., priority alert)
      res.status(200).send('Emergency detected. Proceed with alerting operator.');
    } else {
      console.log(`✅ No emergency for CallSid ${CallSid}`);
      res.status(400).send('No emergency detected.');
    }
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
