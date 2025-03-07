"use client";

import { Card, CardBody, CardFooter } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBroom,
    faSort,
    faArrowsSplitUpAndLeft,
} from "@fortawesome/free-solid-svg-icons";

const pages = [
    {
        title: "Clean",
        icon: faBroom,
        href: "/functions/clean",
        description: "Replace explicit songs from playlists",
    },
    {
        title: "Sort",
        icon: faSort,
        href: "/functions/sort",
        description: "Sort playlists by different criteria",
    },
    {
        title: "Split",
        icon: faArrowsSplitUpAndLeft,
        href: "/functions/split",
        description: "Split up playlists based on criteria",
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
                    <CardFooter className="text-medium justify-center w-64">
                        <b>{page.title}</b>
                    </CardFooter>
                    <CardBody className="overflow-visible p-0 flex justify-center items-center h-[140px]">
                        <div
                            style={{
                                width: "60px",
                                height: "60px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <FontAwesomeIcon
                                icon={page.icon}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    maxWidth: "60px",
                                    maxHeight: "60px",
                                }}
                            />
                        </div>
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
