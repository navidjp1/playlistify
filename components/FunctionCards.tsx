"use client";

import { Card, CardBody, CardFooter, Image } from "@heroui/react";

const pages = [
    // {
    //     title: "Merge",
    //     // img: "/images/fruit-1.jpeg",
    //     href: "/functions/merge",
    //     description: "Merge your different playlists",
    // },
    {
        title: "Clean",
        // img: "/images/fruit-2.jpeg",
        href: "/functions/clean",
        description: "Replace/remove explicit songs",
    },
    {
        title: "Sort",
        // img: "/images/fruit-3.jpeg",
        href: "/functions/sort",
        description: "Sort playlists by different criteria",
    },
    {
        title: "Split",
        // img: "/images/fruit-4.jpeg",
        href: "/functions/split",
        description: "Split up a playlist into more than one",
    },
    {
        title: "Generate",
        // img: "/images/fruit-5.jpeg",
        href: "/functions/generate",
        description: "Create playlists based on your interests",
    },
    {
        title: "Transitions",
        // img: "/images/fruit-6.jpeg",
        href: "/functions/transitions",
        description: "Create playlists with song transitions",
    },
    {
        title: "Random",
        // img: "/images/fruit-6.jpeg",
        href: "/functions/random",
        description: "Generate random songs or playlists",
    },
];
function FunctionCards() {
    return (
        <div className="gap-2 grid grid-cols-2 sm:grid-cols-3">
            {pages.map((page, index) => (
                <Card
                    shadow="sm"
                    key={index}
                    isPressable
                    onPress={() => (window.location.href = page.href)}
                >
                    <CardFooter
                        className="text-m
                    
                    edium justify-center w-64"
                    >
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
    );
}

export default FunctionCards;
