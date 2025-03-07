import { Playlist, PlaylistOptions } from "@/utils/types";

async function splitPlaylist(
    playlists: { id: string; name: string }[],
    criteria: string,
    headers: { Authorization: string },
    options: PlaylistOptions = {}
) {
    if (playlists.length === 0) {
        throw new Error("No playlists selected");
    }

    // We'll split the first playlist in the array
    const playlistId = playlists[0].id;
    const playlistName = playlists[0].name;

    // Get all tracks from the playlist
    const tracks = await getAllTracks(playlistId, headers);

    if (tracks.length === 0) {
        throw new Error("No tracks found in the playlist");
    }

    // Group tracks based on the selected criteria
    const groupedTracks = await groupTracksByCriteria(tracks, criteria, headers);

    // Create new playlists for each group
    const results = await createPlaylistsFromGroups(
        groupedTracks,
        playlistName,
        headers,
        options
    );

    return {
        originalPlaylist: playlistName,
        splitCount: Object.keys(groupedTracks).length,
        newPlaylists: results,
    };
}

async function getAllTracks(playlistId: string, headers: { Authorization: string }) {
    let allTracks: any[] = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

    while (nextUrl) {
        const response = await fetch(nextUrl, { headers });

        if (!response.ok) {
            throw new Error("Failed to fetch tracks from playlist");
        }

        const data = await response.json();
        allTracks = [...allTracks, ...data.items];
        nextUrl = data.next;
    }

    return allTracks;
}

async function groupTracksByCriteria(
    tracks: any[],
    criteria: string,
    headers: { Authorization: string }
) {
    const groups: Record<string, any[]> = {};

    for (const item of tracks) {
        if (!item.track) continue;

        let groupKey = "";

        switch (criteria) {
            case "artist":
                // Group by primary artist
                groupKey = item.track.artists[0]?.name || "Unknown Artist";
                break;

            case "genre":
                // For genre, we need to fetch artist details to get genres
                const artistId = item.track.artists[0]?.id;
                if (artistId) {
                    const artistResponse = await fetch(
                        `https://api.spotify.com/v1/artists/${artistId}`,
                        { headers }
                    );
                    if (artistResponse.ok) {
                        const artistData = await artistResponse.json();
                        groupKey = artistData.genres[0] || "Unknown Genre";
                    } else {
                        groupKey = "Unknown Genre";
                    }
                } else {
                    groupKey = "Unknown Genre";
                }
                break;

            case "popularity":
                // Group by popularity ranges
                const popularity = item.track.popularity;
                if (popularity >= 80) groupKey = "Very Popular (80-100)";
                else if (popularity >= 60) groupKey = "Popular (60-79)";
                else if (popularity >= 40) groupKey = "Moderate (40-59)";
                else if (popularity >= 20) groupKey = "Less Popular (20-39)";
                else groupKey = "Rare (0-19)";
                break;

            case "date":
                // Group by release year
                const releaseDate = item.track.album.release_date;
                if (releaseDate) {
                    const year = releaseDate.split("-")[0];
                    const decade = Math.floor(parseInt(year) / 10) * 10;
                    groupKey = `${decade}s`;
                } else {
                    groupKey = "Unknown Year";
                }
                break;

            case "language":
                // This is more complex and would require additional APIs
                // For now, we'll use a simplified approach based on artist country
                const artistId2 = item.track.artists[0]?.id;
                if (artistId2) {
                    try {
                        const artistResponse = await fetch(
                            `https://api.spotify.com/v1/artists/${artistId2}`,
                            { headers }
                        );
                        if (artistResponse.ok) {
                            const artistData = await artistResponse.json();
                            // This is a simplification - actual language detection would require more sophisticated APIs
                            groupKey = artistData.genres.some(
                                (g: string) =>
                                    g.includes("latin") || g.includes("spanish")
                            )
                                ? "Spanish"
                                : artistData.genres.some((g: string) =>
                                      g.includes("k-pop")
                                  )
                                ? "Korean"
                                : artistData.genres.some((g: string) =>
                                      g.includes("j-pop")
                                  )
                                ? "Japanese"
                                : "English/Other";
                        } else {
                            groupKey = "Unknown Language";
                        }
                    } catch (error) {
                        groupKey = "Unknown Language";
                    }
                } else {
                    groupKey = "Unknown Language";
                }
                break;

            default:
                groupKey = "Unsorted";
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }

        groups[groupKey].push(item);
    }

    return groups;
}

async function createPlaylistsFromGroups(
    groups: Record<string, any[]>,
    originalPlaylistName: string,
    headers: { Authorization: string },
    options: PlaylistOptions
) {
    // Get user ID
    const userResponse = await fetch("https://api.spotify.com/v1/me", { headers });

    if (!userResponse.ok) {
        throw new Error("Failed to fetch user information");
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    const results = [];

    // Create a playlist for each group
    for (const [groupName, tracks] of Object.entries(groups)) {
        if (tracks.length === 0) continue;

        // Create new playlist
        const playlistName = options.name
            ? `${options.name} - ${groupName}`
            : `${originalPlaylistName} - ${groupName}`;

        const createResponse = await fetch(
            `https://api.spotify.com/v1/users/${userId}/playlists`,
            {
                method: "POST",
                headers: {
                    ...headers,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: playlistName,
                    public: options.public !== undefined ? options.public : true,
                    description: `Split from ${originalPlaylistName} by ${groupName}`,
                }),
            }
        );

        if (!createResponse.ok) {
            throw new Error(`Failed to create playlist for ${groupName}`);
        }

        const newPlaylist = await createResponse.json();

        // Extract track URIs
        let trackUris = tracks.map((item) => item.track.uri);

        // Shuffle if requested
        if (options.shuffle) {
            trackUris = shuffleArray(trackUris);
        }

        // Add tracks to the new playlist (in batches of 100)
        for (let i = 0; i < trackUris.length; i += 100) {
            const batch = trackUris.slice(i, i + 100);

            const addResponse = await fetch(
                `https://api.spotify.com/v1/playlists/${newPlaylist.id}/tracks`,
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

            if (!addResponse.ok) {
                throw new Error(`Failed to add tracks to playlist ${playlistName}`);
            }
        }

        results.push({
            name: playlistName,
            id: newPlaylist.id,
            trackCount: tracks.length,
        });
    }

    return results;
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

export default splitPlaylist;
