import axios from 'axios';
const { spotify_client_id, spotify_client_secret } = process.env;

async function refreshAccessToken(req, res) {
    try {
        const refresh_token = req.session.refresh_token;

        if (!refresh_token) {
            return res.status(401).json({ error: 'No refresh token was found' });
        }

        const params = new URLSearchParams();
        params.append("grant_type", "refresh_token");
        params.append("refresh_token", refresh_token);

        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            params.toString(),
            {
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${spotify_client_id}:${spotify_client_secret}`).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        if (response.status === 200) {
            const newAccessToken = response.data.access_token;
            req.session.access_token = newAccessToken;

            // If a new refresh token was provided, update it
            if (response.data.refresh_token) {
                req.session.refresh_token = response.data.refresh_token;
            }

            return newAccessToken;
        } else {
            console.error('Failed to refresh access token:', response.data);
            return null;
        }
    } catch (error) {
        console.error('Error refreshing access token:', error.response?.data || error.message);
        return null;
    }
}

export default { refreshAccessToken };
