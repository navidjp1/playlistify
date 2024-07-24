import { getAccessToken } from "@/lib";
import { cookies } from "next/headers";

async function getToken() {
    const encrypted_access_token = cookies().get("access_token");
    console.log(encrypted_access_token);
    return null;
}

export default async function Merge() {
    const access_token = await getToken();
    // const access_token = await getAccessToken();
    // const [playlists, setPlaylists] = useState<any[]>([]);
    // const [loading, setLoading] = useState<boolean>(true);
    let sentReq = false;

    // useEffect(() => {
    //     if (access_token && !sentReq) {
    //         sentReq = true;
    //         console.log("fetching!");
    //         getPlaylists();
    //     } else {
    //         setLoading(false);
    //     }
    // }, []);

    // const getPlaylists = async () => {
    //     await axios
    //         .get("https://api.spotify.com/v1/me/playlists", {
    //             headers: {
    //                 Authorization: `Bearer ${access_token}`,
    //             },
    //         })
    //         .then((response) => {
    //             //console.log(response.data.items);
    //             setPlaylists(response.data.items);
    //             setLoading(false);
    //         })
    //         .catch((err) => {
    //             console.log("error: ", err);
    //         });
    // };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold">Merge Playlists</h1>
            {/* <h3 className="text-xl font-semibold">{access_token}</h3> */}

            {/* {loading ? (
                <p>Loading playlists...</p>
            ) : (
                <div className="mt-4">
                    <h2 className="text-2xl font-semibold">Your Playlists</h2>
                    {playlists.map((playlist) => (
                        <li key={playlist.id} className="mt-2">
                            {playlist.name}
                        </li>
                    ))}
                </div>
            )} */}
        </div>
    );
}
