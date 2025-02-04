import express from 'express';
import { config } from 'dotenv';
import UserRoutes from './Spotify/Users/routes.js';

const port = 5000
config()

const app = express();
UserRoutes(app);

app.listen(port);
