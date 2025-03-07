import { select } from "@nextui-org/react";
import { Playlist, PlaylistOptions } from "@/utils/types";

const API_BASE_URL = "https://api.spotify.com/v1";

type Headers = {
    Authorization: string;
    "Content-Type"?: string;
};

type Track = {
    uri: string;
    explicit: boolean;
    is_local: boolean;
    name: string;
    artist: string;
};

export default async function sortPlaylist(
    playlists: Playlist[],
    selectedCriteria: string,
    headers: Headers,
    options: PlaylistOptions = {}
) {
    const playlist = playlists[0];
    const tracks: Track[] = [];

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
                const track = {
                    uri: trackData.uri,
                    explicit: trackData.explicit,
                    is_local: trackData.is_local,
                    name: trackData.name,
                    artist: trackData.artists[0].name,
                };
                tracks.push(track);
            });
            url = data.next;
        } catch (error) {
            console.error("Error obtaining playlist data: ", error);
            return;
        }
    }

    // to implement:
    // * add more sorting criteria
    // * group together (by album)
    // * sub sorting (alphabetical, reversed, frequency, etc.)
    tracks.sort((a, b) => {
        switch (selectedCriteria) {
            case "artist":
                return a.artist.localeCompare(b.artist); // Sort alphabetically by artist name

            default:
                console.error("Unknown sorting criteria:", selectedCriteria);
                return 0;
        }
    });

    // prettier-ignore
    const body = JSON.stringify({
        "name": `${playlist.name} (Sorted by ${selectedCriteria})`,
        "description": "Sorted with Playlistify",
        "public": false,
    });

    const trackURIs = tracks.map((track) => track.uri);

    // prettier-ignore
    const newBody = JSON.stringify({
        "uris": trackURIs,
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

        if (trackURIs.length > 100) {
            await handleLargePlaylists(trackURIs, url, headers);
        } else {
            const req = await fetch(url, { method: "POST", headers, body: newBody });

            const res = await req.json();
            if (res.error) {
                console.log(res.error);
                throw new Error("Spotify API returned error.");
            }
        }
    } catch (error) {
        console.error("Error sorting playlists: ", error);
        return;
    }
    console.log("Successfully sorted playlists!");
}

async function handleLargePlaylists(songURIs: string[], url: string, headers: Headers) {
    const limit = 100;
    for (let i = 0; i < songURIs.length; i += limit) {
        const batch = songURIs.slice(i, i + limit);

        // prettier-ignore
        const body = JSON.stringify({ "uris": batch, "position": 0, });

        const response = await fetch(url, { method: "POST", headers, body });

        if (!response.ok) {
            console.error("Error adding tracks to playlist: ", await response.json());
            throw new Error(`Failed to add tracks batch starting at index ${i}`);
        }
    }
}
