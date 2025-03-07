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
    id: string;
};

// Rate limiting helper
const rateLimiter = {
    queue: [] as (() => Promise<any>)[],
    running: false,
    lastRequestTime: 0,
    minDelay: 100, // Minimum delay between requests in ms

    // Add a function to the queue
    enqueue: function (fn: () => Promise<any>): Promise<any> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });

            if (!this.running) {
                this.processQueue();
            }
        });
    },

    // Process the queue with rate limiting
    processQueue: async function () {
        if (this.queue.length === 0) {
            this.running = false;
            return;
        }

        this.running = true;

        // Ensure minimum delay between requests
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < this.minDelay) {
            await new Promise((resolve) => setTimeout(resolve, this.minDelay - elapsed));
        }

        const fn = this.queue.shift();
        if (fn) {
            this.lastRequestTime = Date.now();
            try {
                await fn();
            } catch (error) {
                console.error("Error in rate limited function:", error);
            }
        }

        // Process next item in queue
        this.processQueue();
    },
};

// Retry logic for API calls
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

export default async function cleanPlaylist(
    playlists: Playlist[],
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

    // Get clean versions of explicit tracks
    const cleanedTracks = await getCleanSongs(tracks, headers);

    if (cleanedTracks.length === 0) {
        throw new Error("No clean tracks found after processing");
    }

    // Create a new playlist with the clean tracks
    const result = await createNewPlaylist(
        cleanedTracks,
        playlist.name,
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
        try {
            const response = await retryFetch(url, { method: "GET", headers });

            if (!response.ok) {
                throw new Error("Failed to fetch tracks from playlist");
            }

            const data = await response.json();
            const playlistData: any[] = data.items;

            if (!playlistData) {
                throw new Error("Spotify API returned null object.");
            }

            playlistData.forEach((item) => {
                const trackData = item.track;
                if (!trackData) return; // Skip null tracks

                const track: Track = {
                    uri: trackData.uri,
                    explicit: trackData.explicit,
                    is_local: trackData.is_local,
                    name: trackData.name,
                    artist: trackData.artists[0]?.name || "Unknown Artist",
                    id: trackData.id,
                };
                tracks.push(track);
            });

            url = data.next;
        } catch (error) {
            console.error("Error obtaining playlist data: ", error);
            throw new Error("Failed to fetch tracks from playlist");
        }
    }

    return tracks;
}

async function getCleanSongs(tracks: Track[], headers: Headers): Promise<string[]> {
    // Create a map to cache clean versions to avoid duplicate API calls
    const cleanVersionCache: Map<string, string | null> = new Map();
    const cleanedTracks: string[] = [];

    // Process tracks in smaller batches to avoid rate limiting
    const batchSize = 5; // Reduced batch size

    for (let i = 0; i < tracks.length; i += batchSize) {
        const batch = tracks.slice(i, i + batchSize);
        const promises = batch.map(async (song) => {
            if (song.is_local) {
                return null; // Skip local tracks
            }

            if (!song.explicit) {
                return song.uri; // Already clean
            }

            // Check cache first
            const cacheKey = `${song.name}-${song.artist}`;
            if (cleanVersionCache.has(cacheKey)) {
                return cleanVersionCache.get(cacheKey);
            }

            // Find clean version with rate limiting
            return rateLimiter.enqueue(async () => {
                const cleanVersion = await findCleanVersion(
                    song.name,
                    song.artist,
                    headers
                );
                cleanVersionCache.set(cacheKey, cleanVersion);
                return cleanVersion;
            });
        });

        const results = await Promise.all(promises);
        results.filter(Boolean).forEach((uri) => {
            if (uri) cleanedTracks.push(uri);
        });

        // Add a delay between batches to avoid rate limiting
        if (i + batchSize < tracks.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    return cleanedTracks;
}

async function findCleanVersion(
    songName: string,
    songArtist: string,
    headers: Headers
): Promise<string | null> {
    try {
        // Use more specific search query to improve results
        const query = `track:"${songName}" artist:"${songArtist}"`;
        const url = `${API_BASE_URL}/search?q=${encodeURIComponent(
            query
        )}&type=track&limit=15`;

        const response = await retryFetch(url, { method: "GET", headers });

        if (!response.ok) {
            console.error("Search API error:", await response.json());
            return null;
        }

        const data = await response.json();
        const searchResults = data.tracks.items;

        if (!searchResults || searchResults.length === 0) {
            return null;
        }

        // First try to find an exact match that's clean
        for (const track of searchResults) {
            const exactNameMatch = track.name === songName;
            const exactArtistMatch = track.artists.some(
                (artist: any) => artist.name === songArtist
            );

            if (!track.explicit && exactNameMatch && exactArtistMatch) {
                return track.uri;
            }
        }

        // If no exact match, try similar matches
        for (const track of searchResults) {
            const similarNameMatch = isSimilar(track.name, songName);
            const exactArtistMatch = track.artists.some(
                (artist: any) => artist.name === songArtist
            );

            if (!track.explicit && similarNameMatch && exactArtistMatch) {
                return track.uri;
            }
        }

        // If still no match, try just by artist with similar name
        for (const track of searchResults) {
            const similarNameMatch = isSimilar(track.name, songName);
            const similarArtistMatch = track.artists.some((artist: any) =>
                isSimilar(artist.name, songArtist)
            );

            if (!track.explicit && similarNameMatch && similarArtistMatch) {
                return track.uri;
            }
        }
    } catch (error) {
        console.error("Error searching for clean version: ", error);
    }
    return null;
}

function isSimilar(a: string, b: string): boolean {
    // Normalize strings for better comparison
    const normalizeString = (str: string) => {
        return str
            .toLowerCase()
            .replace(/\(.*?\)/g, "") // Remove content in parentheses
            .replace(/\[.*?\]/g, "") // Remove content in brackets
            .replace(/feat\..*$/i, "") // Remove "feat." and anything after
            .replace(/\s+/g, " ") // Replace multiple spaces with a single space
            .trim();
    };

    const normalizedA = normalizeString(a);
    const normalizedB = normalizeString(b);

    // If strings are identical after normalization, they're similar
    if (normalizedA === normalizedB) return true;

    // Otherwise, calculate Levenshtein distance
    const distance = levenshteinDistance(normalizedA, normalizedB);
    const maxLength = Math.max(normalizedA.length, normalizedB.length);
    const similarity = 1 - distance / maxLength;

    return similarity >= 0.7; // Higher threshold for better accuracy
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

async function createNewPlaylist(
    trackUris: string[],
    originalPlaylistName: string,
    headers: Headers,
    options: PlaylistOptions
): Promise<any> {
    // Get user ID
    const response = await retryFetch(`${API_BASE_URL}/me`, {
        method: "GET",
        headers,
    });

    if (!response.ok) {
        throw new Error("Failed to fetch user information");
    }

    const userData = await response.json();
    const userId = userData.id;

    // Create a new playlist
    const playlistName = options.name ? options.name : `${originalPlaylistName} (Clean)`;

    const createResponse = await retryFetch(`${API_BASE_URL}/users/${userId}/playlists`, {
        method: "POST",
        headers: {
            ...headers,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: playlistName,
            public: options.public !== undefined ? options.public : false,
            description: `Clean version created with Playlistify`,
        }),
    });

    if (!createResponse.ok) {
        throw new Error("Failed to create new playlist");
    }

    const newPlaylist = await createResponse.json();

    // Shuffle if requested
    let finalTrackUris = [...trackUris];
    if (options.shuffle) {
        finalTrackUris = shuffleArray(finalTrackUris);
    }

    // Add tracks to the new playlist (in batches of 100)
    await addTracksToPlaylist(finalTrackUris, newPlaylist.id, headers);

    return {
        name: playlistName,
        id: newPlaylist.id,
        trackCount: finalTrackUris.length,
        explicitRemoved: trackUris.length,
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
