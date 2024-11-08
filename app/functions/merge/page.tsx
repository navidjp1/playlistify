import PlaylistCheckbox from "@/components/PlaylistCheckbox";
import { Playlist } from "@/utils/types";
import { getAccessToken, getPlaylists } from "@/utils/getData";

/**
 * Page that displays a list of playlists and allows the user to select
 * up to 3 of them to merge together.
 *
 * The user is shown a list of all their playlists, and they can select
 * up to 3 of them. Then, the selected playlists are merged into one
 * new playlist containing all the tracks from the selected playlists.
 *
 */
export default async function Merge() {
    let access_token = await getAccessToken();
    const playlists: Array<Playlist> = await getPlaylists(access_token);
    const headers = { functionType: "merge", maxSelections: 3 };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-8">
            <h1 className="text-4xl font-bold">Merge Playlists</h1>
            <br />
            {playlists ? (
                <PlaylistCheckbox playlists={playlists} headers={headers} />
            ) : (
                <p>Loading playlists...</p>
            )}
        </div>
    );
}
