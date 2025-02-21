import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import UserRoutes from './Spotify/Users/routes.js';
import PlaylistRoutes from './Spotify/Playlists/routes.js';
import SearchRoutes from './Spotify/Search/routes.js';

global.myVar = '';
const port = 5000
config()

const app = express();

app.use(cors({
    credentials: true,
    origin: process.env.HOSTING_URL || "http://localhost:5173",
}))

UserRoutes(app);
PlaylistRoutes(app);
SearchRoutes(app);

app.listen(port);
