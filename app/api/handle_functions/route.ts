"use server";
import { NextResponse } from "next/server";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;
const TOKEN_URL = process.env.SPOTIFY_TOKEN_URL!;

export async function POST(request: Request) {
    try {
        const { selectedPlaylists, functionType } = await request.json();
        console.log(selectedPlaylists);
        console.log(functionType);

        return NextResponse.json({ message: "success" });
    } catch (err) {
        return NextResponse.json(
            { message: "Error handling tokens: ", err },
            { status: 500 }
        );
    }
}
