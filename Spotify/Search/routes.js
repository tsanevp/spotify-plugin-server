import axios from 'axios';

export default function SearchRoutes(app) {
    app.get('/search', async (req, res) => {
        try {
            const { q, type, market, limit, offset, include_external } = req.query;

            // Validate required parameters
            if (!q || !type) {
                return res.status(400).json({ error: 'Missing required parameters: q and type' });
            }

            const params = {
                q,
                type,
                market,
                limit,
                offset,
                include_external
            };

            const response = await axios.get('https://api.spotify.com/v1/search', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${global.myVar}`
                },
                params
            });

            res.json(response.data);
        } catch (error) {
            console.error('Error fetching search results:', error.response?.data || error.message);
            res.status(error.response?.status || 500).json({ error: error.response?.data || 'Internal Server Error' });
        }
    });
}
