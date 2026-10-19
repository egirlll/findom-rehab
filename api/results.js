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
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const auth = req.headers['x-admin-key'];
    if (auth !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const db = await getDb();
        const submissions = await db.collection('submissions')
            .find({})
            .sort({ timestamp: -1 })
            .limit(200)
            .toArray();

        res.status(200).json({ submissions, total: submissions.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
