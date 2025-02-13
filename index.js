import express from 'express';
import { config } from 'dotenv';
import UserRoutes from './Spotify/Users/routes.js';
import PlaylistRoutes from './Spotify/Playlists/routes.js';

global.myVar = '';
const port = 5000
config()

const app = express();
UserRoutes(app);
PlaylistRoutes(app);


app.listen(port);
