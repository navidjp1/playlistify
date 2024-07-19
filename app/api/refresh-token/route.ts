import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import querystring from "querystring";
import { parseCookies, setCookie } from "nookies";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const TOKEN_URL = process.env.SPOTIFY_TOKEN_URL!;

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const cookies = parseCookies({ req });
    const refresh_token = cookies.refresh_token || null;

    if (refresh_token) {
        const response = await axios.post(
            TOKEN_URL,
            querystring.stringify({
                grant_type: "refresh_token",
                refresh_token: refresh_token,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const newTokenInfo = response.data;
        setCookie({ res }, "access_token", newTokenInfo.access_token, {
            maxAge: newTokenInfo.expires_in,
            path: "/",
        });
        res.redirect("/");
    } else {
        res.redirect("/api/login");
    }
};
