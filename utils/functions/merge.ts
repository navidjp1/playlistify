import { Playlist, PlaylistOptions } from "../types";

const API_BASE_URL = "https://api.spotify.com/v1";

type Headers = {
    Authorization: string;
    "Content-Type"?: string;
};

export default async function mergePlaylists(
    playlists: Playlist[],
    headers: Headers,
    options: PlaylistOptions = {}
) {
    const songURIs: string[] = [];

    for (const playlist of playlists) {
        let offset = 0;
        const limit = 100;
        let url = `${API_BASE_URL}/playlists/${playlist.id}/tracks?limit=${limit}&offset=${offset}`;
        while (url) {
            try {
                const response = await fetch(url, { method: "GET", headers });
                const data = await response.json();
                const playlistData: any[] = data.items;
                if (!playlistData) {
                    console.log(data);
                    throw new Error("Spotify API returned null object.");
                }
                playlistData.forEach((item) => {
                    const trackData = item.track;
                    const trackURI: string = trackData.uri;
                    songURIs.push(trackURI);
                });
                url = data.next;
            } catch (error) {
                console.error("Error obtaining playlist data: ", error);
                return;
            }
        }
    }

    // prettier-ignore
    const body = JSON.stringify({
        "name": "Merged Playlist",
        "description": "New playlist description",
        "public": false,
    });

    // prettier-ignore
    const newBody = JSON.stringify({
        "uris": songURIs,
        "position": 0,
    });

    headers["Content-Type"] = "application/json";

    try {
        const request = await fetch(`${API_BASE_URL}/me/playlists`, {
            method: "POST",
            headers,
            body,
        });
        const createdPlaylist = await request.json();
        const newPlaylistID = createdPlaylist.id;
        const url = `${API_BASE_URL}/playlists/${newPlaylistID}/tracks`;

        if (songURIs.length > 100) {
            await handleLargePlaylists(songURIs, url, headers);
        } else {
            const req = await fetch(url, { method: "POST", headers, body: newBody });

            const res = await req.json();
            if (res.error) {
                console.log(res.error);
                throw new Error("Spotify API returned error.");
            }
        }
    } catch (error) {
        console.error("Error merging playlists: ", error);
        return;
    }
    console.log("Successfully merged playlists!");
}

async function handleLargePlaylists(songURIs: string[], url: string, headers: Headers) {
    const limit = 100;
    for (let i = 0; i < songURIs.length; i += limit) {
        const batch = songURIs.slice(i, i + limit);
        console.log(batch + "\n NEXT BATCH:");

        // prettier-ignore
        const body = JSON.stringify({ "uris": batch, "position": 0, });

        const response = await fetch(url, { method: "POST", headers, body });

        if (!response.ok) {
            console.error("Error adding tracks to playlist: ", await response.json());
            throw new Error(`Failed to add tracks batch starting at index ${i}`);
        }
    }
}
