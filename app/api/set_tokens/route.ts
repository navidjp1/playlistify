"use server";
import { setTokens } from "@/lib";
import { NextResponse } from "next/server";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;
const TOKEN_URL = process.env.SPOTIFY_TOKEN_URL!;

export async function POST(request: Request) {
    try {
        const { code, codeVerifier } = await request.json();
        const payload = {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                grant_type: "authorization_code",
                code: code,
                redirect_uri: REDIRECT_URI,
                code_verifier: codeVerifier!,
            }),
        };
        const response = await fetch(TOKEN_URL, payload);
        const tokenInfo = await response.json();

        await setTokens(
            tokenInfo.access_token,
            tokenInfo.refresh_token,
            tokenInfo.expires_in
        );
        return NextResponse.json({ message: "success" });
    } catch (err) {
        return NextResponse.json(
            { message: "Error handling tokens: ", err },
            { status: 500 }
        );
    }
}
