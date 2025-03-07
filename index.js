import express from 'express';
import session from "express-session";
import cors from 'cors';
import { config } from 'dotenv';
import UserRoutes from './Spotify/Users/routes.js';
import PlaylistRoutes from './Spotify/Playlists/routes.js';
import SearchRoutes from './Spotify/Search/routes.js';
import ServerRoutes from './Spotify/Server/routes.js';

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
        maxAge: 24 * 60 * 60 * 1000, // 24 hour max age
    }
};

const domain = process.env.NODE_SERVER_DOMAIN ? process.env.NODE_SERVER_DOMAIN.trim() : ""
console.log("THIS IS MY DOMAIN: ", domain);

if (process.env.NODE_ENV !== "development") {
    sessionOptions.proxy = true;
    sessionOptions.cookie = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        domain: process.env.NODE_SERVER_DOMAIN,
    };
}
app.use(session(sessionOptions));
app.use(express.json());

UserRoutes(app);
PlaylistRoutes(app);
SearchRoutes(app);
ServerRoutes(app);

app.listen(port);
