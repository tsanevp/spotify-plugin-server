import axios from 'axios';
import crypto from 'crypto';
import refreshAccessToken from '../tokenManager.js'

export default function UserRoutes(app) {
  const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
  const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const node_server_url = process.env.NODE_SERVER_URL;
  const hosting_url = process.env.HOSTING_URL;
  const TOP_TYPES = new Set("artists", "tracks");

  const getUserProfile = async (req, res, firstCall = true) => {
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
      if (error.message && error.status === 401 && firstCall) {
        const newAccessToken = await refreshAccessToken(req, res);
        if (newAccessToken) {
          getUserProfile(req, res, false);
        } else {
          return res.status(401).json({ error: 'Unable to refresh access token' });
        }
      } else {
        console.error('Error fetching user profile:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data || 'Internal Server Error' });
      }
    }
  };

  const getUserTopItems = async (req, res, firstCall = true) => {
    try {
      const access_token = req.session.access_token;
      if (!access_token) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { type } = req.params;
      if (!TOP_TYPES.has(type)) return;

      const response = await axios.get(`https://api.spotify.com/v1/top/${type}`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      res.json(response.data);
    } catch (error) {
      if (error.message && error.status === 401 && firstCall) {
        const newAccessToken = await refreshAccessToken(req, res);
        if (newAccessToken) {
          getUserTopItems(req, res, false);
        } else {
          return res.status(401).json({ error: 'Unable to refresh access token' });
        }
      } else {
        console.error(`Error fetching user top ${type}:`, error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data || 'Internal Server Error' });
      }
    }
  };

  const userLogin = async (req, res) => {
    const verifier = generateCodeVerifier(128);
    req.session.code_verifier = verifier;

    const challenge = await generateCodeChallenge(verifier);
    const params = new URLSearchParams();

    params.append("client_id", spotify_client_id);
    params.append("response_type", "code");
    params.append("redirect_uri", `${node_server_url}/callback`);
    params.append("scope", "user-read-private user-read-email playlist-read-private user-top-read playlist-modify-public playlist-modify-private");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    res.redirect(`https://accounts.spotify.com/authorize/?${params.toString()}`);
  };

  const userCallback = async (req, res) => {
    try {
      const code = req.query.code;
      const verifier = req.session.code_verifier
      if (!verifier) {
        return res.status(400).send('Code verifier not found in session');
      }

      const params = new URLSearchParams();
      params.append("client_id", spotify_client_id);
      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", `${node_server_url}/callback`);
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

        res.redirect(`${hosting_url}/callback?success=true`);
      } else
      {
        res.redirect(`${hosting_url}/callback?success=false`);
      }
    } catch (error) {
      console.error('Error getting access token:', error.response ? error.response.data : error.message);
      res.redirect(`${hosting_url}/callback?success=false`);
    }
  };

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
