"use server";
require("dotenv").config();
import { NextResponse } from "next/server";
import axios from "axios";
import querystring from "querystring";
import { getAccessToken, setTokens } from "@/lib";
import { access } from "fs";

// const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
const TOKEN_URL = process.env.SPOTIFY_TOKEN_URL!;

export async function POST(request: Request) {
    try {
        const { code, codeVerifier } = await request.json();

        const response = await axios.post(
            TOKEN_URL,
            querystring.stringify({
                client_id: CLIENT_ID,
                grant_type: "authorization_code",
                code: code,
                redirect_uri: REDIRECT_URI,
                code_verifier: codeVerifier,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const tokenInfo = response.data;
        await setTokens(
            tokenInfo.access_token,
            tokenInfo.refresh_token,
            tokenInfo.expires_in
        );

        return NextResponse.json("Success");
    } catch (err) {
        return NextResponse.json({
            error: `Error processing the callback: ${err}`,
        });
    }
}
