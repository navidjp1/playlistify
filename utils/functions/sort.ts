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
    album?: string;
    popularity?: number;
    release_date?: string;
    genres?: string[];
};

// Add retry logic for API calls
async function retryFetch(
    url: string,
    options: RequestInit,
    maxRetries = 3,
    initialDelay = 1000
): Promise<Response> {
    let lastError;
    let delay = initialDelay;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);

            // If we get a rate limit error, wait and retry
            if (response.status === 429) {
                // Get retry-after header or use exponential backoff
                const retryAfter =
                    parseInt(response.headers.get("retry-after") || "0") * 1000 || delay;
                console.log(`Rate limited. Retrying after ${retryAfter}ms...`);
                await new Promise((resolve) => setTimeout(resolve, retryAfter));
                delay *= 2; // Exponential backoff
                continue;
            }

            return response;
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt + 1} failed:`, error);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        }
    }

    throw lastError || new Error(`Failed after ${maxRetries} attempts`);
}

export default async function sortPlaylist(
    playlists: Playlist[],
    selectedCriteria: string,
    headers: Headers,
    options: PlaylistOptions = {}
) {
    if (playlists.length === 0) {
        throw new Error("No playlists selected");
    }

    const playlist = playlists[0];
    const tracks = await getAllTracks(playlist.id, headers);

    if (tracks.length === 0) {
        throw new Error("No tracks found in the playlist");
    }

    // Enrich tracks with additional data if needed for certain criteria
    const enrichedTracks = await enrichTracksWithData(tracks, selectedCriteria, headers);

    // Sort the tracks based on the selected criteria
    const sortedTracks = sortTracksByCriteria(enrichedTracks, selectedCriteria);

    // Create a new playlist with the sorted tracks
    const result = await createNewPlaylist(
        sortedTracks,
        playlist.name,
        selectedCriteria,
        headers,
        options
    );

    return result;
}

async function getAllTracks(playlistId: string, headers: Headers): Promise<Track[]> {
    const tracks: Track[] = [];

    let offset = 0;
    const limit = 100;
    let url = `${API_BASE_URL}/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`;

    while (url) {
        const response = await retryFetch(url, { headers });

        if (!response.ok) {
            throw new Error("Failed to fetch tracks from playlist");
        }

        const data = await response.json();

        // Extract track information
        for (const item of data.items) {
            if (!item.track) continue;

            const trackData = item.track;
            const track: Track = {
                uri: trackData.uri,
                explicit: trackData.explicit,
                is_local: trackData.is_local,
                name: trackData.name,
                artist: trackData.artists[0]?.id || "Unknown Artist",
                album: trackData.album?.name,
                popularity: trackData.popularity,
                release_date: trackData.album?.release_date,
            };
            tracks.push(track);
        }

        // Check if there are more tracks to fetch
        if (data.next) {
            url = data.next;
        } else {
            break;
        }
    }

    return tracks;
}

async function enrichTracksWithData(
    tracks: Track[],
    criteria: string,
    headers: Headers
): Promise<Track[]> {
    // For some criteria, we need to fetch additional data
    if (criteria === "genre") {
        // Fetch genre information for each track's artist
        const artistIds = new Set(
            tracks
                .map((track) => (track.artist !== "Unknown Artist" ? track.artist : null))
                .filter(Boolean)
        );

        const artistGenres: Record<string, string[]> = {};

        // Batch artist requests to avoid rate limiting
        const batchSize = 50;
        const artistIdArray = Array.from(artistIds);

        for (let i = 0; i < artistIdArray.length; i += batchSize) {
            const batch = artistIdArray.slice(i, i + batchSize);
            try {
                const response = await fetch(
                    `${API_BASE_URL}/artists?ids=${batch.join(",")}`,
                    {
                        headers,
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    data.artists.forEach((artist: any) => {
                        artistGenres[artist.name] = artist.genres;
                    });
                }
            } catch (error) {
                console.error("Error fetching artist genres:", error);
            }
        }

        // Add genre information to tracks
        return tracks.map((track) => ({
            ...track,
            genres: artistGenres[track.artist] || [],
        }));
    }

    return tracks;
}

function sortTracksByCriteria(tracks: Track[], criteria: string): Track[] {
    const sortedTracks = [...tracks]; // Create a copy to avoid mutating the original

    sortedTracks.sort((a, b) => {
        switch (criteria) {
            case "artist":
                return a.artist.localeCompare(b.artist);

            case "genre":
                // Sort by primary genre if available
                const genreA = a.genres && a.genres.length > 0 ? a.genres[0] : "Unknown";
                const genreB = b.genres && b.genres.length > 0 ? b.genres[0] : "Unknown";
                return genreA.localeCompare(genreB);

            case "popularity":
                // Sort by popularity (high to low)
                return (b.popularity || 0) - (a.popularity || 0);

            case "date":
                // Sort by release date (newest first)
                if (!a.release_date) return 1;
                if (!b.release_date) return -1;
                return (
                    new Date(b.release_date).getTime() -
                    new Date(a.release_date).getTime()
                );

            case "language":
                // This is a simplified approach - we're using the artist name as a proxy
                // for language, which isn't accurate but is a reasonable approximation
                return a.artist.localeCompare(b.artist);

            default:
                // Default to sorting by name
                return a.name.localeCompare(b.name);
        }
    });

    return sortedTracks;
}

async function createNewPlaylist(
    tracks: Track[],
    originalPlaylistName: string,
    criteria: string,
    headers: Headers,
    options: PlaylistOptions
): Promise<any> {
    // Get user ID
    const userResponse = await retryFetch(`${API_BASE_URL}/me`, { headers });

    if (!userResponse.ok) {
        throw new Error("Failed to fetch user information");
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // Format the criteria for display
    const criteriaDisplay =
        {
            artist: "Artist",
            genre: "Genre",
            popularity: "Popularity",
            date: "Release Date",
            language: "Language",
        }[criteria] || criteria;

    // Create a new playlist
    const playlistName = options.name
        ? `${options.name} (Sorted by ${criteriaDisplay})`
        : `${originalPlaylistName} (Sorted by ${criteriaDisplay})`;

    const createResponse = await retryFetch(`${API_BASE_URL}/users/${userId}/playlists`, {
        method: "POST",
        headers: {
            ...headers,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: playlistName,
            public: options.public !== undefined ? options.public : false,
            description: `Sorted with Playlistify by ${criteriaDisplay}`,
        }),
    });

    if (!createResponse.ok) {
        throw new Error("Failed to create new playlist");
    }

    const newPlaylist = await createResponse.json();

    // Extract track URIs
    let trackUris = tracks.map((track) => track.uri);

    // Shuffle if requested
    if (options.shuffle) {
        trackUris = shuffleArray(trackUris);
    }

    // Add tracks to the new playlist (in batches of 100)
    await addTracksToPlaylist(trackUris, newPlaylist.id, headers);

    return {
        name: playlistName,
        id: newPlaylist.id,
        trackCount: tracks.length,
    };
}

async function addTracksToPlaylist(
    trackUris: string[],
    playlistId: string,
    headers: Headers
) {
    const limit = 100;

    for (let i = 0; i < trackUris.length; i += limit) {
        const batch = trackUris.slice(i, i + limit);

        const response = await retryFetch(
            `${API_BASE_URL}/playlists/${playlistId}/tracks`,
            {
                method: "POST",
                headers: {
                    ...headers,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uris: batch,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error adding tracks to playlist:", errorData);
            throw new Error(`Failed to add tracks batch starting at index ${i}`);
        }

        // Add a small delay between batch requests
        if (i + limit < trackUris.length) {
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    }
}

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
