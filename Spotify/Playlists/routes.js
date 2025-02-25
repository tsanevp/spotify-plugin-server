import axios from 'axios';

export default function PlaylistRoutes(app) {
    const createUserPlaylist = async (req, res) => {
        try {
            const { uid } = req.params;

            if (!uid) {
                return res.status(400).json({ error: 'Missing required parameter: user_id' });
            }

            const response = await axios.post(
                `https://api.spotify.com/v1/users/${uid}/playlists`,
                req.body,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${global.myVar}`
                    }
                }
            );

            res.json(response.data);
        } catch {
            console.error('Error creating user playlist:', error.response?.data || error.message);
            res.status(error.response?.status || 500).json({ error: error.response?.data || 'Internal Server Error' });
        }
    };

    const getUserPlaylists = async (req, res) => {
        try {
            const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: {
                    'Authorization': `Bearer ${global.myVar}`
                }
            });

            res.json(response.data);
        } catch (error) {
            console.error("Error fetching playlists:", error.response?.data || error.message);
            res.status(error.response?.status || 500).json({ error: "Failed to fetch playlists" });
        }
    };

    const getPlaylistTracks = async (req, res) => {
        try {
            const { pid } = req.params;
            let offset = req.query.offset;

            if (!offset) {
                offset = '0';
            }

            if (!pid) {
                return res.status(400).json({ error: 'Missing required parameter: playlist_id' });
            }

            const response = await axios.get(
                `https://api.spotify.com/v1/playlists/${pid}/tracks?offset=${offset}&limit=100`,
                {
                    headers: {
                        'Authorization': `Bearer ${global.myVar}`
                    }
                }
            );

            res.json(response.data);
        } catch {
            console.error("Error fetching playlist tracks:", error.response?.data || error.message);
            res.status(error.response?.status || 500).json({ error: "Failed to fetch playlists tracks" });
        }
    };

    app.post('/user/:uid/playlists/create', createUserPlaylist);
    app.get('/user/playlists', getUserPlaylists);
    app.get('/user/playlists/:pid/tracks', getPlaylistTracks);
};