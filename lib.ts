import { access } from "fs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = "sF6nY0ziI8";
const key = new TextEncoder().encode(secretKey);
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const TOKEN_URL = process.env.SPOTIFY_TOKEN_URL!;

export async function encrypt(payload: any, expiration: string) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiration)
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ["HS256"],
    });
    return payload;
}

export async function setTokens(
    access_token: string,
    refresh_token: string,
    expires_in: number
) {
    // Encrypt the tokens
    const accessToken = await encrypt({ access_token }, "1h");
    const refreshToken = await encrypt({ refresh_token }, "30d");

    // Save the tokens in cookies
    cookies().set("access_token", accessToken, {
        expires: Date.now() + expires_in * 1000,
        path: "/",
        httpOnly: true,
    });
    cookies().set("refresh_token", refreshToken, {
        expires: Date.now() + 60 * 60 * 24 * 30 * 1000, // 30 days
        path: "/",
        httpOnly: true,
    });
}

export async function updateTokens(refresh_token: string, res: NextResponse) {
    try {
        const payload = {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: refresh_token,
                client_id: CLIENT_ID!,
            }),
        };
        const response = await fetch(TOKEN_URL, payload);
        const newTokenInfo = await response.json();
        const new_access_token = newTokenInfo.access_token;
        const new_refresh_token = newTokenInfo.refresh_token;
        const new_expires_in = newTokenInfo.expires_in;

        const newAccessToken = await encrypt({ new_access_token }, "1h");
        const newRefreshToken = await encrypt({ new_refresh_token }, "30d");
        res.cookies.set("access_token", newAccessToken, {
            expires: Date.now() + new_expires_in * 1000,
            path: "/",
            httpOnly: true,
        });
        res.cookies.set("refresh_token", newRefreshToken, {
            expires: Date.now() + 60 * 60 * 24 * 30 * 1000, // 30 days
            path: "/",
            httpOnly: true,
        });
    } catch (err) {
        console.error("Could not update tokens: ", err);
        res.headers.set("x-error-message", "update tokens failed");
    }
    return res;
}

export async function clearTokens(res: NextResponse) {
    res.cookies.delete("access_token");
    res.cookies.delete("refresh_token");
}

export async function getAccessToken() {
    const access_token = cookies().get("access_token")?.value;
    if (!access_token) return null;
    return await decrypt(access_token);
}

export async function getRefreshToken() {
    const refresh_token = cookies().get("refresh_token")?.value;
    if (!refresh_token) return null;
    return await decrypt(refresh_token);
}

export async function deleteAccessToken(res: NextResponse) {
    res.cookies.delete("access_token");
    return res;
}
