import { NextRequest, NextResponse } from "next/server";
import { checkLoggedIn, updateTokens, getRefreshToken } from "@/lib";
import { toast } from "sonner";

export default async function middleware(request: NextRequest) {
    let res = NextResponse.next();

    const isLoggedIn = await checkLoggedIn();
    if (!isLoggedIn) {
        const refresh_token_cookie = await getRefreshToken();
        if (!refresh_token_cookie) {
            res.headers.set("x-error-message", "not logged in");
        } else {
            const refresh_token = refresh_token_cookie.refresh_token;
            res = await updateTokens(refresh_token, res);
        }
    }

    const error = res.headers.get("x-error-message");
    if (error) {
        const url = new URL("/", request.url);
        if (error === "not logged in") {
            toast.error("Please authenticate your account before proceeding.");
            url.searchParams.set("error", "not_logged_in");
        } else {
            url.searchParams.set("error", "system_error");
        }
        res = NextResponse.redirect(url);
    }

    return res;
}

export const config = {
    matcher: [
        "/functions/merge",
        "/functions/clean",
        "/functions/sort",
        "/functions/split",
        "/functions/generate",
    ],
};
