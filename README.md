# APi Endpoints Needed:
## Search
### Endpoint
https://api.spotify.com/v1/search
### Parameters
- q: query
- type: comma separated list of items to search across -> "album", "artist", "playlist", "track", "show", "episode", "audiobook"
- market: Country code
- limit: max amount to return in each type
- offset: index of first result to return
- include_external: (not using)

## Get Current User's Playlists
### Endpoint
https://api.spotify.com/v1/me/playlists
### Parameters
- limit: max amount to items to return (max 50, default 20)
- offset: index of first playlist to return

## Create new playlist
### Endpoint
https://api.spotify.com/v1/users/{user_id}/playlists
### Parameters
- user_id: username to create the playlist for
### Body
- name: playlist name
- public: visible to public
- collaborative: other people can edit
- description: text description of playlist

https://api.spotify.com/v1/playlists/{playlist_id}
