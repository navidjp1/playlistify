// export type Playlist = {
//     collaborative: boolean;
//     description: string;
//     external_urls: object;
//     href: string;
//     id: string;
//     name: string;
//     owner: object;
//     public: boolean;
//     snapshot_id: string;
//     tracks: object;
//     type: string;
//     uri: string;
// };

export type Playlist = {
    id: string;
    name: string;
    public: boolean;
    images: ImageObject[];
};

export type ImageObject = {
    url: string;
    height: number;
    width: number;
};

export type PlaylistOptions = {
    name?: string;
    public?: boolean;
    shuffle?: boolean;
};
