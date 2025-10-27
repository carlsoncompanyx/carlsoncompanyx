// api/n8n-webhook.js - FOR PERSONAL USE ONLY (NO SECURITY)

export default async function handler(req, res) {
    
    // 1. Check for the correct HTTP method (Webhooks must be POST)
    if (req.method !== 'POST') {
        // Return 405 for methods other than POST
        return res.status(405).json({ message: 'Method Not Allowed. Only POST is accepted.' });
    }
    
    // 2. Get the data payload
    // Vercel/Next.js typically parses the body into req.body for you
    const payload = req.body;

    // 3. Log the received data
    console.log('✅ Webhook received successfully!');
    console.log('Received Payload:', payload);
    
    // 4. Run your custom logic here (e.g., database update, file creation)
    // --- YOUR LOGIC GOES HERE ---
    
    // 5. Send a final success response back to n8n
    // This tells n8n the request succeeded
    return res.status(200).json({ 
        success: true, 
        message: 'Payload received and logged.' 
    });
}
