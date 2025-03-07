"use server";

import { NextResponse } from "next/server";
import { getAccessToken } from "@/utils/getData";
import cleanPlaylist from "@/utils/functions/clean";
import sortPlaylist from "@/utils/functions/sort";
import splitPlaylist from "@/utils/functions/split";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;
const TOKEN_URL = process.env.SPOTIFY_TOKEN_URL!;

export async function POST(request: Request) {
    try {
        const {
            selectedPlaylists,
            externalPlaylistLink,
            selectedCriteria,
            functionType,
            playlistOptions,
        } = await request.json();

        // Parse selected playlists if they exist
        let playlists =
            selectedPlaylists.length > 0
                ? selectedPlaylists.map((playlist: string) => JSON.parse(playlist))
                : [];

        const access_token = await getAccessToken();
        if (!access_token) throw new Error("Access token not found");
        const headers = {
            Authorization: `Bearer ${access_token}`,
        };

        if (externalPlaylistLink) {
            const response = await fetch(
                `https://api.spotify.com/v1/playlists/${
                    externalPlaylistLink.split("/playlist/")[1].split("?")[0]
                }`,
                {
                    headers,
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch external playlist");
            }

            const externalPlaylist = await response.json();
            playlists = [{ id: externalPlaylist.id, name: externalPlaylist.name }];
        }

        let result;

        switch (functionType) {
            case "clean":
                result = await cleanPlaylist(playlists, headers, playlistOptions);
                break;
            case "sort":
                result = await sortPlaylist(
                    playlists,
                    selectedCriteria,
                    headers,
                    playlistOptions
                );
                break;
            case "split":
                result = await splitPlaylist(
                    playlists,
                    selectedCriteria,
                    headers,
                    playlistOptions
                );
                break;
            default:
                throw new Error("Invalid function type");
        }

        return NextResponse.json({
            message: "success",
            result,
        });
    } catch (err: any) {
        console.error("Error in handle_functions:", err);
        return NextResponse.json(
            { message: err.message || "An error occurred" },
            { status: 500 }
        );
    }
}
