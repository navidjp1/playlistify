"use client";
"use state";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        console.log("test useEffect");
    }, []);

    const handleLogin = async () => {
        console.log("callback");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold">Callback Screen</h1>
        </div>
    );
}
