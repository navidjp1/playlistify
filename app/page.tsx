"use client";
"use state";

import { useEffect, useState } from "react";
import axios from "axios";
import { parseCookies } from "nookies";

const Home: React.FC = () => {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const cookies = parseCookies();
    const access_token = cookies.access_token;

    useEffect(() => {
        if (access_token) {
            axios
                .get("https://api.spotify.com/v1/me/playlists", {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                })
                .then((response) => {
                    setPlaylists(response.data.items);
                    setLoading(false);
                })
                .catch(() => {
                    axios.get("/api/refresh-token").then(() => {
                        window.location.reload();
                    });
                });
        } else {
            setLoading(false);
        }
    }, [access_token]);

    const handleLogin = async () => {
        await axios
            .post("http://localhost:3000/api/login")
            .then((result) => {
                // console.log(result.data);
                const { authUrl, codeVerifier } = result.data;
                console.log(authUrl);
                // console.log(codeVerifier);
                // window.localStorage.setItem("code_verifier", codeVerifier);
                window.location.href = authUrl;
            })
            .catch((err) => console.log(err));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold">Welcome</h1>
            {!access_token ? (
                <button
                    onClick={handleLogin}
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
                >
                    Login with Spotify
                </button>
            ) : loading ? (
                <p>Loading playlists...</p>
            ) : (
                <div className="mt-4">
                    <h2 className="text-2xl font-semibold">Your Playlists</h2>
                    <ul>
                        {playlists.map((playlist) => (
                            <li key={playlist.id} className="mt-2">
                                {playlist.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Home;
