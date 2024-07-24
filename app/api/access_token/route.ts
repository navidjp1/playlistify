import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib";

// const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

export async function POST(request: Request) {
    try {
        // const access_token_cookie = await getAccessToken();
        // //console.log(access_token_cookie);
        // const access_token = access_token_cookie.access_token;
        // console.log(access_token);

        return NextResponse.json("HI");
    } catch (err) {
        return NextResponse.json({
            error: `Error processing the callback: ${err}`,
        });
    }
}
