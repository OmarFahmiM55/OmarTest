const express = require('express');
const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const IPAAS_URL = process.env.IPAAS_URL;

app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

app.post('/', async (req, res) => {
  const body = req.body;
  
  try {
    const message = body.entry[0].changes[0].value.messages[0];
    
    if (message.type === 'button') {
      const payload = message.button.payload;
      const from = message.from;
      
      console.log('Button tapped:', payload, 'From:', from);
      
      // Forward to iPaaS
      const fetch = require('node-fetch');
      await fetch(IPAAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: payload.startsWith('APPROVE') ? 'APPROVE' : 'REJECT',
          ticketId: payload.split('_')[1],
          from: from
        })
      });
    }
  } catch (e) {
    console.log('Not a button message, ignoring');
  }
  
  res.status(200).end();
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
