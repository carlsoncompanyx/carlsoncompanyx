// Corrected Vercel Serverless Function (api/n8n-webhook.js)

// 1. Use the ES Module 'import' syntax for dependencies
import { parse } from 'url';
import { createHmac } from 'crypto';

// The function is now exported using 'export default'
export default async function handler(req, res) {
    
    // 2. Check the HTTP Method
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method Not Allowed. Only POST is accepted.' });
        return;
    }
    
    // 3. Retrieve the Secret Key from Vercel Environment Variables
    const expectedSecret = process.env.N8N_WEBHOOK;

    if (!expectedSecret) {
        // This should never happen in production if ENV is set, but is good for debugging
        console.error('N8N_WEBHOOK is not set in environment variables.');
        res.status(500).json({ error: 'Server configuration error.' });
        return;
    }

    // --- Authentication & Validation ---
    
    const signature = req.headers['x-n8n-signature'];
    
    // NOTE: In Vercel, the body might already be parsed for you if using Next.js, 
    // but for plain Vercel functions, you might need to read the body stream.
    // We assume the body is available as a string for HMAC calculation.
    let rawBody;
    
    // Attempt to get the raw body for signature verification (Crucial for HMAC)
    // If the framework/runtime (like Next.js) has already parsed it, you might need 
    // a specific Vercel configuration or middleware to pass the raw body.
    // For a simple Vercel node function, we'll try to read it.
    
    try {
        if (typeof req.body === 'object' && req.body !== null) {
            // If Vercel/Framework has parsed it, we need to stringify it back.
            // NOTE: This can be tricky if the n8n payload includes things like dates 
            // that are stringified differently than the raw payload.
            // A better practice is to disable body parsing for this route.
            rawBody = JSON.stringify(req.body); 
        } else {
            rawBody = req.body; // Assume it is a raw string
        }
    } catch (e) {
        // If body retrieval fails, log and exit.
        console.error('Error retrieving raw request body:', e);
        res.status(400).json({ error: 'Invalid request body.' });
        return;
    }
    
    // Calculate the HMAC signature
    const hmac = createHmac('sha256', expectedSecret);
    hmac.update(rawBody || ''); // Use rawBody or an empty string if null
    const calculatedSignature = hmac.digest('hex');

    if (calculatedSignature !== signature) {
        console.warn('Webhook signature mismatch!');
        res.status(401).json({ error: 'Unauthorized: Invalid signature.' });
        return;
    }
    
    // --- Processing the Webhook Payload ---
    
    const payload = req.body;

    console.log('Successfully received and authenticated n8n webhook.');
    //console.log('Payload:', payload); // Log the payload for inspection

    // 4. Implement your core logic here
    // Example: Process the data, save to a database, etc.
    // ... your logic ...
    
    // 5. Send a 200 OK response back to n8n
    res.status(200).json({ 
        success: true, 
        message: 'Webhook received and processed successfully!' 
    });
}
