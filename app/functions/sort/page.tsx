import PlaylistCheckbox from "@/components/PlaylistCheckbox";
import { Playlist } from "@/utils/types";
import { getAccessToken, getPlaylists } from "@/utils/getData";

export default async function Sort() {
    let access_token = await getAccessToken();
    const playlists: Array<Playlist> = await getPlaylists(access_token);
    const headers = { functionType: "sort", maxSelections: 1 };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-8">
            <h1 className="text-4xl font-bold">Sort Playlists</h1>

            <br />
            {playlists ? (
                <PlaylistCheckbox playlists={playlists} headers={headers} />
            ) : (
                <p>Loading playlists...</p>
            )}
        </div>
    );
}
