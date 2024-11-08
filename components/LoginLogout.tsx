"use client";
import React from "react";
import createAuthUrl from "@/utils/authUrl";
import { toast } from "sonner";

const authorizeUser = async () => {
    const authUrl = await createAuthUrl();
    window.location.href = authUrl;
};

const logout = async () => {
    const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (response.ok) {
        window.location.href = "/";
        toast.success("Successfully logged out!");
    }
};

export async function LoginButton() {
    return (
        <div>
            <button
                onClick={authorizeUser}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
            >
                Login with Spotify
            </button>
        </div>
    );
}

export async function LogoutButton() {
    return (
        <div>
            <button
                onClick={logout}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            >
                Logout
            </button>
        </div>
    );
}
