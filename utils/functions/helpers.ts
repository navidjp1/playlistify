// Common helper functions for playlist operations

/**
 * Retry fetch with exponential backoff
 */
export async function retryFetch(
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

/**
 * Add tracks to a playlist in batches
 */
export async function addTracksToPlaylist(
    trackUris: string[],
    playlistId: string,
    headers: { Authorization: string; "Content-Type"?: string },
    batchSize = 100
) {
    for (let i = 0; i < trackUris.length; i += batchSize) {
        const batch = trackUris.slice(i, i + batchSize);

        const response = await retryFetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
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
        if (i + batchSize < trackUris.length) {
            await new Promise((resolve) => setTimeout(resolve, 300));
        }
    }
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Get user profile information
 */
export async function getUserProfile(headers: { Authorization: string }) {
    const response = await retryFetch("https://api.spotify.com/v1/me", { headers });

    if (!response.ok) {
        throw new Error("Failed to fetch user information");
    }

    return await response.json();
}
