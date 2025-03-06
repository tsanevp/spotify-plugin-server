import axios from 'axios';
import refreshAccessToken from '../tokenManager.js';

export default function SearchRoutes(app) {
    const searchRoutes = async (req, res, firstCall = true) => {
        try {
            const access_token = req.session.access_token;
            if (!access_token) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const { q, type, market, limit, offset, include_external } = req.query;
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
                    'Authorization': `Bearer ${access_token}`
                },
                params: params
            });

            res.json(response.data);
        } catch (error) {
            if (error.message && error.status === 401 && firstCall) {
                const newAccessToken = await refreshAccessToken(req, res);
                if (newAccessToken) {
                    searchRoutes(req, res, false);
                } else {
                    return res.status(401).json({ error: 'Unable to refresh access token' });
                }
            } else {
                console.error('Error fetching search results:', error.response?.data || error.message);
                res.status(error.response?.status || 500).json({ error: error.response?.data || 'Internal Server Error' });
            }
        }
    };

    app.get('/search', searchRoutes);
}
