const SECRET = process.env.N8N_WEBHOOK;

module.exports = async (req, res) => {
  // 1. Enforce POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  // 2. Security Check (Highly Recommended)
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${SECRET}`) {
      return res.status(401).json({ message: 'Unauthorized: Invalid or missing secret key.' });
  }

  // 3. Process the incoming JSON body
  try {
    // Vercel functions automatically parse the JSON body into req.body
    const emailData = req.body;
    
    console.log('Email content received from n8n:', emailData);

    // TODO: Add your logic here!
    // For example: save to a file, push to a database, etc.
    
    // 4. Send a success response back to n8n
    res.status(200).json({ 
      status: 'success', 
      received_subject: emailData.subject 
    });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
