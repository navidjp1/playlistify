"use client";

import React, { useState, useEffect, useRef } from "react";
import { Checkbox, CheckboxGroup, Button, select } from "@heroui/react";
import { Card, CardBody, CardFooter, Image } from "@heroui/react";
import { Playlist } from "@/utils/types";
import { toast } from "sonner";
import CriteriaSelect from "./CriteriaSelect";
import LinkInput from "./LinkInput";

type PlaylistCheckboxProps = {
    playlists: Playlist[];
    headers: {
        functionType: string;
        maxSelections: number;
    };
};

export default function PlaylistCheckbox({ playlists, headers }: PlaylistCheckboxProps) {
    const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
    const [selectedCriteria, setSelectedCriteria] = useState("");
    const [playlistLink, setPlaylistLink] = useState("");

    const handleCardPress = async (playlist: Playlist) => {
        const playlistData = JSON.stringify({
            id: playlist.id,
            name: playlist.name,
        });

        const contains = selectedPlaylists.includes(playlistData);

        if (selectedPlaylists.length === headers.maxSelections) {
            if (contains) {
                await setSelectedPlaylists(
                    selectedPlaylists.filter((p) => p !== playlistData)
                );
            } else {
                toast.error(
                    `Too many selections. You can only select up to ${headers.maxSelections} playlists.`
                );
            }
            return;
        }

        if (contains) {
            await setSelectedPlaylists(
                selectedPlaylists.filter((p) => p !== playlistData)
            );
        } else {
            await setSelectedPlaylists([...selectedPlaylists, playlistData]); // Add to selected
        }
    };

    const handleSubmit = async () => {
        if (selectedPlaylists.length > headers.maxSelections) {
            // prompt user to select less playlists
            alert(
                `Too many selections. Select fewer than ${
                    headers.maxSelections + 1
                } playlists.`
            );
            return;
        }
        try {
            const response = await fetch("/api/handle_functions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    selectedPlaylists,
                    selectedCriteria,
                    functionType: headers.functionType,
                }),
            });

            const data = await response.json();
            // window.location.reload();
            if (data.message != "success") {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error("Error sending api call to handle selections: ", error);
            // display error message
            toast.error("There was an error in the system. Please try again later.");
        }
        toast.success(`Successfully ${headers.functionType}d playlists!`);
        setSelectedPlaylists([]);
    };

    const isSelected = (playlist: string) => selectedPlaylists.includes(playlist);

    return (
        <div>
            {headers.functionType === "sort" && (
                <CriteriaSelect
                    selected={selectedCriteria}
                    setSelected={setSelectedCriteria}
                />
            )}
            {headers.functionType === "split" && (
                <LinkInput selected={playlistLink} setSelected={setPlaylistLink} />
            )}
            <div className="gap-2 grid grid-cols-6">
                {playlists.map((playlist: Playlist) => (
                    <Card
                        shadow="sm"
                        key={playlist.id}
                        isPressable
                        className={`hover:bg-blue-500 justify-center outline-none ${
                            isSelected(
                                JSON.stringify({
                                    id: playlist.id,
                                    name: playlist.name,
                                })
                            )
                                ? "bg-blue-500"
                                : ""
                        }`}
                        onPress={() => handleCardPress(playlist)}
                    >
                        <CardFooter className="text-medium justify-center">
                            <b>{playlist.name}</b>
                        </CardFooter>
                        <CardBody className="">
                            <Image
                                shadow="sm"
                                className=" object-scale-down h-[150px]"
                                src={playlist.images[0].url}
                            />
                        </CardBody>
                    </Card>
                ))}
            </div>

            <div className={`fixed bottom-8 z-50 left-1/2 transform -translate-x-1/2`}>
                <Button
                    onPress={handleSubmit}
                    className="hover:bg-blue-500 justify-center items-center mt-4 text-white py-3 px-8 rounded-lg text-2xl shadow-lg font-bold "
                >
                    {headers.functionType.toUpperCase()}
                </Button>
            </div>
        </div>
    );
}
