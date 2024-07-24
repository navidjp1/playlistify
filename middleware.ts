import { access } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, updateTokens, getRefreshToken, deleteAccessToken } from "@/lib";

export default async function middleware(request: NextRequest) {
    let res = NextResponse.next();

    // res = await deleteAccessToken(res);

    const access_token = await getAccessToken();
    if (!access_token) {
        const refresh_token_cookie = await getRefreshToken();
        if (!refresh_token_cookie) {
            res.headers.set("x-error-message", "not logged in");
        }
        const refresh_token = refresh_token_cookie.refresh_token;
        res = await updateTokens(refresh_token, res);
    }

    const error = res.headers.get("x-error-message");
    if (error) {
        const url = new URL("/", request.url);
        if (error === "not logged in") {
            url.searchParams.set("error", "not_logged_in");
        } else {
            url.searchParams.set("error", "system_error");
        }
        res = NextResponse.redirect(url);
    }

    return res;
}

export const config = {
    matcher: ["/merge", "/clean", "/sort", "/split", "/generate"],
};
