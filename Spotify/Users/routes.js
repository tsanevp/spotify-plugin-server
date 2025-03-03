import axios from 'axios';
import crypto from 'crypto';

export default function UserRoutes(app) {
  const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
  const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const verifier = generateCodeVerifier(128);
  const TOP_TYPES = new Set("artists", "tracks");

  const getUserProfile = async (req, res, firstCall) => {
    try {
      const access_token = req.session.access_token;

      if (!access_token) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      res.json(response.data);
    } catch (error) {
      if (error.message && error.status === 401) {
        const newAccessToken = await refreshAccessToken(req, res);
        if (newAccessToken) {

        }
        
      }
      console.error('Error fetching user profile:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ error: error.response?.data || 'Internal Server Error' });
    }
  };

  const getUserTopItems = async (req, res) => {
    try {
      const { type } = req.params;

      if (!TOP_TYPES.has(type)) return;

      const response = await axios.get(`https://api.spotify.com/v1/top/${type}`, {
        headers: {
          'Authorization': `Bearer ${global.myVar}`
        }
      });

      res.json(response.data);
    } catch (error) {
      console.error(`Error fetching user top ${type}:`, error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ error: error.response?.data || 'Internal Server Error' });
    }
  };

  const userLogin = async (req, res) => {
    const challenge = await generateCodeChallenge(verifier);
    const params = new URLSearchParams();

    params.append("client_id", spotify_client_id);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5000/callback");
    params.append("scope", "user-read-private user-read-email playlist-read-private user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    res.redirect(`https://accounts.spotify.com/authorize/?${params.toString()}`);
  };

  const userCallback = async (req, res) => {
    try {
      const code = req.query.code;
      const params = new URLSearchParams();
      params.append("client_id", spotify_client_id);
      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", "http://localhost:5000/callback");
      params.append("code_verifier", verifier);

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
        const access_token = response.data.access_token;
        const refresh_token = response.data.refresh_token;

        // Store tokens in session
        req.session.access_token = access_token;
        req.session.refresh_token = refresh_token;

        res.redirect("http://localhost:5173/callback");
      }
    } catch (error) {
      console.error('Error getting access token:', error.response ? error.response.data : error.message);
      res.status(500).send('Authentication failed');
    }
  };

  async function refreshAccessToken(req, res) {
    try {
      const refresh_token = req.session.refresh_token_token;

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

  function generateCodeVerifier(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  app.get('/user/profile', getUserProfile);
  app.get('/user/top/:type', getUserTopItems);
  app.get('/auth/login', userLogin);
  app.get('/callback', userCallback);
};
