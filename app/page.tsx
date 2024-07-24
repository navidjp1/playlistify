"use client";
import axios from "axios";
import { Card, CardBody, CardFooter, Image } from "@nextui-org/react";

const Home: React.FC = () => {
    const pages = [
        {
            title: "Merge",
            // img: "/images/fruit-1.jpeg",
            href: "/merge",
            description: "Merge your different playlists",
        },
        {
            title: "Clean",
            // img: "/images/fruit-2.jpeg",
            href: "/clean",
            description: "Replace/remove explicit songs",
        },
        {
            title: "Sort",
            // img: "/images/fruit-3.jpeg",
            href: "/sort",
            description: "Sort playlists by different criteria",
        },
        {
            title: "Split",
            // img: "/images/fruit-4.jpeg",
            href: "/split",
            description: "Split up a playlist into more than one",
        },
        {
            title: "Generate",
            // img: "/images/fruit-5.jpeg",
            href: "/generate",
            description: "Create playlists based on your interests",
        },
        {
            title: "Coming soon...",
            // img: "/images/fruit-6.jpeg",
            href: "/",
            description: "...",
        },
    ];

    const handleLogin = async () => {
        await axios
            .post("http://localhost:3000/api/spotify_auth")
            .then((result) => {
                const { authUrl, codeVerifier } = result.data;
                window.localStorage.setItem("code_verifier", codeVerifier);
                window.location.href = authUrl;
            })
            .catch((err) => console.log(err));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold">Welcome</h1>
            <button
                onClick={handleLogin}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
            >
                Login with Spotify
            </button>
            <br />
            <div className="gap-2 grid grid-cols-2 sm:grid-cols-3">
                {pages.map((page, index) => (
                    <Card
                        shadow="sm"
                        key={index}
                        isPressable
                        onPress={() => (window.location.href = page.href)}
                    >
                        <CardFooter className="text-medium justify-center w-64">
                            <b>{page.title}</b>
                        </CardFooter>
                        <CardBody className="overflow-visible p-0">
                            <Image
                                shadow="sm"
                                radius="lg"
                                width="100%"
                                alt={page.title}
                                className="w-full object-cover h-[140px]"
                                // src={item.img}
                            />
                        </CardBody>
                        <CardFooter className="text-tiny font-light justify-center w-64">
                            <b>{page.description}</b>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Home;
