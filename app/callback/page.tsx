"use client";
import { useEffect } from "react";
import { useSearchParams, redirect } from "next/navigation";
import axios from "axios";

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
                const codeVerifier =
                    window.localStorage.getItem("code_verifier");
                const response = await axios.post("/api/callback", {
                    code,
                    codeVerifier,
                });
                if (response.data != "Success") {
                    console.error(response.data);
                    // redirect to error page.
                }
                window.location.href = "http://localhost:3000/";
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
