"use server";
import { NextResponse } from "next/server";
import { getAccessToken } from "@/utils/getData";
import { mergePlaylists } from "@/utils/functionHandler";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;
const TOKEN_URL = process.env.SPOTIFY_TOKEN_URL!;

export async function POST(request: Request) {
    try {
        const { selectedPlaylists, functionType } = await request.json();
        const playlists = selectedPlaylists.map((playlist: string) =>
            JSON.parse(playlist)
        );

        const access_token = await getAccessToken();
        if (!access_token) throw new Error("Access token not found");
        const headers = {
            Authorization: `Bearer ${access_token}`,
        };
        await mergePlaylists(playlists, headers);

        return NextResponse.json({ message: "success" });
    } catch (err) {
        return NextResponse.json(
            { message: "Error handling tokens: ", err },
            { status: 500 }
        );
    }
}
