import axios from 'axios';
import refreshAccessToken from '../tokenManager.js';

export default function PlaylistRoutes(app) {
    const createUserPlaylist = async (req, res, firstCall = true) => {
        try {
            const access_token = req.session.access_token;
            if (!access_token) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

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
                        'Authorization': `Bearer ${access_token}`
                    }
                }
            );

            res.json(response.data);
        } catch (error) {
            if (error.message && error.status === 401 && firstCall) {
                const newAccessToken = await refreshAccessToken(req, res);
                if (newAccessToken) {
                    createUserPlaylist(req, res, false);
                } else {
                    return res.status(401).json({ error: 'Unable to refresh access token' });
                }
            } else {
                console.error('Error creating user playlist:', error.response?.data || error.message);
                res.status(error.response?.status || 500).json({ error: error.response?.data || 'Internal Server Error' });
            }
        }
    };

    const getUserPlaylists = async (req, res, firstCall = true) => {
        try {
            const access_token = req.session.access_token;
            if (!access_token) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            res.json(response.data);
        } catch (error) {
            if (error.message && error.status === 401 && firstCall) {
                const newAccessToken = await refreshAccessToken(req, res);
                if (newAccessToken) {
                    getUserPlaylists(req, res, false);
                } else {
                    return res.status(401).json({ error: 'Unable to refresh access token' });
                }
            } else {
                console.error("Error fetching playlists:", error.response?.data || error.message);
                res.status(error.response?.status || 500).json({ error: "Failed to fetch playlists" });
            }
        }
    };

    const getPlaylistTracks = async (req, res, firstCall = true) => {
        try {
            const access_token = req.session.access_token;
            if (!access_token) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

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
                        'Authorization': `Bearer ${access_token}`
                    }
                }
            );

            res.json(response.data);
        } catch (error) {
            if (error.message && error.status === 401 && firstCall) {
                const newAccessToken = await refreshAccessToken(req, res);
                if (newAccessToken) {
                    getPlaylistTracks(req, res, false);
                } else {
                    return res.status(401).json({ error: 'Unable to refresh access token' });
                }
            } else {
                console.error("Error fetching playlist tracks:", error.response?.data || error.message);
                res.status(error.response?.status || 500).json({ error: "Failed to fetch playlists tracks" });
            }
        }
    };

    app.post('/user/:uid/playlists/create', createUserPlaylist);
    app.get('/user/playlists', getUserPlaylists);
    app.get('/user/playlists/:pid/tracks', getPlaylistTracks);
};