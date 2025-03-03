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

const sessionOptions = {
    secret: process.env.SESSION_SECRET || "spotify",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
    }
};

if (process.env.NODE_ENV !== "development") {
    sessionOptions.proxy = true;
    sessionOptions.cookie = {
        sameSite: "none",
        secure: true,
        domain: process.env.NODE_SERVER_DOMAIN,
    };
}

UserRoutes(app);
PlaylistRoutes(app);
SearchRoutes(app);

app.listen(port);
