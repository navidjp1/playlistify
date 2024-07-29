import PlaylistCheckbox from "@/components/PlaylistCheckbox";
import { Playlist } from "@/utils/types";
import { getAccessToken, getPlaylists } from "@/utils/getData";
import { testUpdate } from "@/lib";
import { cookies } from "next/headers";

export default async function Merge() {
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    let access_token = await getAccessToken();
    const playlists: Array<Playlist> = await getPlaylists(access_token);
    const headers = { functionType: "clean", maxSelections: 1 };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold">Clean Playlists</h1>
            <br />
            {playlists ? (
                <PlaylistCheckbox playlists={playlists} headers={headers} />
            ) : (
                <p>Loading playlists...</p>
            )}
        </div>
    );
}
