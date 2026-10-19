module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { username, answers } = req.body;
        if (!username || !answers) return res.status(400).json({ error: 'Missing data' });

        const botToken = process.env.TG_BOT_TOKEN;
        const chatId = process.env.TG_CHAT_ID;

        if (!botToken || !chatId) return res.status(500).json({ error: 'Bot not configured' });

        const msg = `🏥 New Rehab Submission\n\n👤 @${username.replace('@', '')}\n\n1️⃣ Addicted for: ${answers[0]}\n2️⃣ Total sent: ${answers[1]}\n3️⃣ Dom style: ${answers[2]}\n4️⃣ Relapse frequency: ${answers[3]}\n5️⃣ Weakness: ${answers[4]}`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg })
        });

        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
