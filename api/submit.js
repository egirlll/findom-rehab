const { MongoClient } = require('mongodb');

let cachedClient = null;

async function getDb() {
    if (cachedClient) return cachedClient.db('findom-rehab');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    cachedClient = client;
    return client.db('findom-rehab');
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { username, answers } = req.body;
        if (!username || !answers) return res.status(400).json({ error: 'Missing data' });

        const db = await getDb();
        const result = await db.collection('submissions').insertOne({
            username: username.trim().toLowerCase().replace('@', ''),
            answers,
            timestamp: new Date(),
            ip: req.headers['x-forwarded-for'] || 'unknown'
        });

        // Send to Telegram
        const botToken = process.env.TG_BOT_TOKEN;
        const chatId = process.env.TG_CHAT_ID;
        if (botToken && chatId) {
            const msg = `🏥 New Rehab Submission\n\n👤 @${username}\n\n1️⃣ Addicted for: ${answers[0]}\n2️⃣ Total sent: ${answers[1]}\n3️⃣ Triggers: ${answers[2]}\n4️⃣ Relapse frequency: ${answers[3]}\n5️⃣ Type of girl: ${answers[4]}`;
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: msg })
            }).catch(() => {});
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
