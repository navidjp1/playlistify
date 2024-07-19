import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import querystring from "querystring";
import { setCookie } from "nookies";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
const TOKEN_URL = process.env.SPOTIFY_TOKEN_URL!;

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const code = req.query.code || null;

    if (code) {
        const response = await axios.post(
            TOKEN_URL,
            querystring.stringify({
                code: code,
                redirect_uri: REDIRECT_URI,
                grant_type: "authorization_code",
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const tokenInfo = response.data;
        setCookie({ res }, "access_token", tokenInfo.access_token, {
            maxAge: tokenInfo.expires_in,
            path: "/",
        });
        setCookie({ res }, "refresh_token", tokenInfo.refresh_token, {
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: "/",
        });
        res.redirect("/");
    } else {
        res.redirect("/?error=access_denied");
    }
};
