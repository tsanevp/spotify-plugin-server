import querystring from 'querystring';
import axios from 'axios';
import crypto from 'crypto';

export default function UserRoutes(app) {
  const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
  const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const verifier = generateCodeVerifier(128);

  app.get('/user/profile', async (req, res) => {
    try {
      const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: {
          'Authorization': `Bearer ${global.myVar}`
        }
      });

      res.json(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({ error: error.response?.data || 'Internal Server Error' });
    }
  });

  app.get('/auth/login', async (req, res) => {
    const challenge = await generateCodeChallenge(verifier);
    const params = new URLSearchParams();

    params.append("client_id", spotify_client_id);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5000/callback");
    params.append("scope", "user-read-private user-read-email playlist-read-private");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    res.redirect(`https://accounts.spotify.com/authorize/?${params.toString()}`);
  });

  app.get('/callback', async (req, res) => {
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
        global.myVar = access_token;
        console.log(global.myVar);
        const refresh_token = response.data.refresh_token;
        const queryString = querystring.stringify({
          access_token: access_token,
          refresh_token: refresh_token
        });

        res.redirect(`http://localhost:5173/profile?${queryString}`);
      }
    } catch (error) {
      console.error('Error getting access token:', error.response ? error.response.data : error.message);
      res.status(500).send('Authentication failed');
    }
  });

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
};
