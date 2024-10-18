import { decrypt, updateTokens, getRefreshToken } from "@/lib";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Playlist } from "./types";

export async function getAccessToken() {
    const encrypted_access_token = await cookies().get("access_token")?.value;
    if (!encrypted_access_token) return null;
    const access_token_cookie = await decrypt(encrypted_access_token!);
    const access_token = access_token_cookie.access_token;
    return access_token;
}

export async function getPlaylists(access_token: string) {
    try {
        const payload = {
            method: "GET",
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        };
        const response = await fetch("https://api.spotify.com/v1/me/playlists", payload);
        const data = await response.json();
        const spotifyPlaylistObjects = data.items;
        if (!spotifyPlaylistObjects) {
            console.log(data);
            throw new Error("Spotify API returned null object.");
        }
        let playlists = spotifyPlaylistObjects.map((playlistObject: any) => ({
            id: playlistObject.id,
            name: playlistObject.name,
            public: playlistObject.public,
            images: playlistObject.images,
            // add more if needed
        }));
        playlists = playlists.filter(
            (playlist: Playlist) =>
                playlist.images[0].url !==
                "https://lexicon-assets.spotifycdn.com/DJ-Beta-CoverArt-300.jpg"
        );
        return playlists;
    } catch (error) {
        console.error("Error fetching playlists: ", error);
        return null;
    }
}
