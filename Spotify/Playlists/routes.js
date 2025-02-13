import axios from 'axios';
import { response } from 'express';

export default function PlaylistRoutes(app) {

    app.get('/user/playlists', async (req, res) => {
        console.log(global.myVar)
        const response = await axios.get(
            'https://api.spotify.com/v1/me/playlists',
            {
                headers: {
                    'Authorization': `Bearer ${global.myVar}`
                }
            }
        );
        console.log(response.data);


    });
};