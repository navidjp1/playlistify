import PlaylistCheckbox from "@/components/PlaylistCheckbox";
import { Playlist } from "@/utils/types";
import { getAccessToken, getPlaylists } from "@/utils/getData";

const handleSubmit = (selectedPlaylists: any) => {
    console.log("Selected Playlists: ", selectedPlaylists);
    // Handle the selected playlists as needed, e.g., send them to the backend
};

export default async function Merge() {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const access_token = await getAccessToken();
    const playlists: Array<Playlist> = await getPlaylists(access_token);
    const headers = { functionType: "merge", maxSelections: 3 };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
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
