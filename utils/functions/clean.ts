import { Playlist, PlaylistOptions } from "../types";

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

export default async function cleanPlaylist(
    playlists: Playlist[],
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

    // prettier-ignore
    const body = JSON.stringify({
        "name": `${playlist.name} (Clean)`,
        "description": "Cleaned with Playlistify",
        "public": false,
    });

    const cleanedTrackURIs: string[] = await getCleanSongs(tracks, headers);

    // prettier-ignore
    const newBody = JSON.stringify({
        "uris": cleanedTrackURIs,
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

        if (cleanedTrackURIs.length > 100) {
            await handleLargePlaylists(cleanedTrackURIs, url, headers);
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

async function getCleanSongs(tracks: Track[], headers: Headers) {
    let cleanedTracks: string[] = [];
    for (const song of tracks) {
        if (!song.is_local) {
            if (song.explicit) {
                const cleanSong = await findCleanVersion(song.name, song.artist, headers);
                if (cleanSong) cleanedTracks.push(cleanSong);
            } else {
                cleanedTracks.push(song.uri);
            }
        }
    }
    return cleanedTracks;
}

async function findCleanVersion(songName: string, songArtist: string, headers: Headers) {
    try {
        const url = `${API_BASE_URL}/search?q=${encodeURIComponent(
            `${songName} ${songArtist}`
        )}&type=track&limit=15`;
        const response = await fetch(url, { method: "GET", headers });
        const data = await response.json();
        const searchResults = data.tracks.items;

        for (const track of searchResults) {
            let sameName = track.name === songName;
            if (!sameName) {
                sameName = isSimilar(track.name, songName);
            }
            const sameArtist = await track.artists.some(
                (artist: any) => artist.name === songArtist
            );
            if (!track.explicit && sameArtist && sameName) {
                return track.uri;
            }
        }
    } catch (error) {
        console.error("Error searching for clean version: ", error);
    }
    return null;
}

function isSimilar(a: string, b: string): boolean {
    const distance = levenshteinDistance(a, b);
    const similarity = 1 - distance / Math.max(a.length, b.length);
    return similarity >= 0.15; // Adjust the threshold as necessary
}

function levenshteinDistance(a: string, b: string): number {
    const matrix = [];

    // Increment along the first column of each row
    let i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // Increment each column in the first row
    let j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
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
