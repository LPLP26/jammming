const clientId = 'd83b111261b44fae9d81879a4cc8bec8';
const redirectUri = "JAMMMING.surge.sh";
const spotifyUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
let accessToken = '';
let expiresIn = 0;

const Spotify = {
    getAccessToken() {
        if (accessToken) {
            return accessToken;
        }

        const urlAccessToken = window.location.href.match(/access_token=([^&]*)/);
        const urlExpiresIn = window.location.href.match(/expires_in=([^&]*)/);

        if (urlAccessToken && urlExpiresIn) {
            accessToken = urlAccessToken[1];
            expiresIn = urlExpiresIn[1];
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
        } else {
            window.location = spotifyUrl;
        }
    },

    search(term) {
        Spotify.getAccessToken();
        let searchUrl = `https://api.spotify.com/v1/search?q=${term}&type=track`;
        fetch(searchUrl, {
            headers: {Authorization: `Bearer ${accessToken}`
            }   
        }).then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Request failed!');
        }, networkError => console.log(networkError.message))
        .then(jsonResponse => {
            if (jsonResponse.tracks) {
                return jsonResponse.tracks.items.map(track => {
                    return {
                        id: track.id,
                        name: track.name,
                        artist: track.artists[0].name, 
                        album: track.album.name,
                        uri: track.uri
                    }
                })
            } else {
                return [];
            }
        })
    },

    savePlaylist(name, trackUris) {
        if (!name || !trackUris) {
            return;
        };
        const userUrl = 'https://api.spotify.com/v1/me';
        const headers = {
            Authorization: `Bearer ${accessToken}`
        };
        let userId = '';
        let playlistId = '';
        fetch(userUrl, {
            headers: headers
        }).then(response => response.json())
        .then(jsonResponse => userId = jsonResponse.id)
        .then(() => {
            let newPlaylist = `https://api.spotify.com/v1/users/${userId}/playlists`;
            fetch(newPlaylist, {
                headers: headers, 
                method: 'POST',
                body: JSON.stringify({
                    name: name
                })
            })
        }).then(response => response.json())
        .then(jsonResponse => playlistId = jsonResponse.id)
        .then(() => {
            const addTracksToPlaylist = `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`;
            fetch(addTracksToPlaylist, {
                headers: headers,
                method: 'POST',
                body: JSON.stringify({
                    uris: trackUris
                })
            })
        }).then(response => response.json())
        .then(jsonResponse => playlistId = jsonResponse.id)
    }
};

export default Spotify;