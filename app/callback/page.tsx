"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function Callback() {
    const searchParams = useSearchParams();
    let callFunction = true;

    const handleCallback = async () => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (code && callFunction) {
            callFunction = false;
            // Code exists, exchange it for an access token
            try {
                const codeVerifier = window.localStorage.getItem("code_verifier");
                const response = await fetch("/api/set_tokens", {
                    method: "POST",
                    body: JSON.stringify({ code, codeVerifier }),
                });
                const data = await response.json();
                if (data.message != "success") {
                    console.error(data.message);
                    // redirect to error page.
                } else {
                    window.localStorage.removeItem("code_verifier");
                    // window.location.href = "http://localhost:3000/";
                    window.location.href = "https://playlistify-omega.vercel.app/";
                }
            } catch (err) {
                console.error("Error exchanging code for token: ", err);
            }
        } else if (error) {
            console.error("Error during authorization: ", error);
        }
    };

    useEffect(() => {
        if (callFunction) {
            handleCallback();
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold">Processing authorization...</h1>
        </div>
    );
}
