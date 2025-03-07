"use client";

import React, { useState } from "react";
import { Button, Tabs, Tab, Spinner } from "@heroui/react";
import { Card, CardBody, CardFooter, Image } from "@heroui/react";
import { Playlist } from "@/utils/types";
import { toast } from "sonner";
import CriteriaSelect from "./CriteriaSelect";
import LinkInput from "./LinkInput";
import ConfirmationModal from "./ConfirmationModal";

type PlaylistCheckboxProps = {
    playlists: Playlist[];
    headers: {
        functionType: string;
        maxSelections: number;
    };
};

export default function PlaylistCheckbox({ playlists, headers }: PlaylistCheckboxProps) {
    // Playlist selection state
    const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
    const [playlistLink, setPlaylistLink] = useState("");
    const [selectionMethod, setSelectionMethod] = useState("my-playlists"); // "my-playlists" or "external-link"

    // Criteria state
    const [selectedCriteria, setSelectedCriteria] = useState("");

    // Confirmation modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [shuffle, setShuffle] = useState(false);

    // Loading state
    const [isLoading, setIsLoading] = useState(false);

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

    const validateSpotifyLink = (link: string) => {
        // Basic validation for Spotify playlist links
        const spotifyRegex =
            /^https:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+(\?.*)?$/;
        return spotifyRegex.test(link);
    };

    const handleSubmit = async () => {
        // Validate selections
        if (selectionMethod === "my-playlists") {
            if (selectedPlaylists.length === 0) {
                toast.error("Please select at least one playlist");
                return;
            }

            if (selectedPlaylists.length > headers.maxSelections) {
                toast.error(
                    `Too many selections. Select fewer than ${
                        headers.maxSelections + 1
                    } playlists.`
                );
                return;
            }
        } else {
            // Validate external link
            if (!playlistLink) {
                toast.error("Please enter a playlist link");
                return;
            }

            if (!validateSpotifyLink(playlistLink)) {
                toast.error("Please enter a valid Spotify playlist link");
                return;
            }
        }

        // Validate criteria for sort and split functions
        if (
            (headers.functionType === "sort" || headers.functionType === "split") &&
            !selectedCriteria
        ) {
            toast.error("Please select a sorting criteria");
            return;
        }

        // Open confirmation modal
        setIsModalOpen(true);
    };

    const handleConfirm = async () => {
        setIsModalOpen(false);
        setIsLoading(true);

        // Show loading toast
        const loadingToast = toast.loading(
            `Processing ${headers.functionType} operation...`
        );

        try {
            const response = await fetch("/api/handle_functions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    selectedPlaylists:
                        selectionMethod === "my-playlists" ? selectedPlaylists : [],
                    externalPlaylistLink:
                        selectionMethod === "external-link" ? playlistLink : "",
                    selectedCriteria,
                    functionType: headers.functionType,
                    playlistOptions: {
                        name: newPlaylistName,
                        public: isPublic,
                        shuffle: shuffle,
                    },
                }),
            });

            const data = await response.json();

            // Dismiss the loading toast
            toast.dismiss(loadingToast);

            if (data.message !== "success") {
                throw new Error(data.message);
            }

            // Show success message with details if available
            if (data.result) {
                if (headers.functionType === "split" && data.result.newPlaylists) {
                    toast.success(
                        <div>
                            <p>
                                Successfully split playlist into {data.result.splitCount}{" "}
                                new playlists!
                            </p>
                            <ul className="mt-2 list-disc pl-4">
                                {data.result.newPlaylists
                                    .slice(0, 3)
                                    .map((p: any, i: number) => (
                                        <li key={i}>
                                            {p.name} ({p.trackCount} tracks)
                                        </li>
                                    ))}
                                {data.result.newPlaylists.length > 3 && (
                                    <li>
                                        ...and {data.result.newPlaylists.length - 3} more
                                    </li>
                                )}
                            </ul>
                        </div>
                    );
                } else {
                    toast.success(
                        `Successfully ${headers.functionType}d playlists! Check your spotify library to see the new playlist`
                    );
                }
            } else {
                toast.success(
                    `Successfully ${headers.functionType}d playlists! Check your spotify library to see the new playlist`
                );
            }

            // Reset state
            setSelectedPlaylists([]);
            setPlaylistLink("");
            setNewPlaylistName("");
        } catch (error: any) {
            // Dismiss the loading toast
            toast.dismiss(loadingToast);

            console.error("Error sending api call to handle selections: ", error);
            toast.error(
                `Error: ${
                    error.message ||
                    "There was an error in the system. Please try again later."
                }`
            );
        } finally {
            setIsLoading(false);
        }
    };

    const isSelected = (playlist: string) => selectedPlaylists.includes(playlist);

    // Extract playlist names for the confirmation modal
    const selectedPlaylistNames = selectedPlaylists.map((playlist) => {
        try {
            return JSON.parse(playlist).name;
        } catch (e) {
            return "Unknown playlist";
        }
    });

    return (
        <div className="space-y-4">
            {/* Section 1: Criteria Selection (only for sort and split) */}
            {(headers.functionType === "sort" || headers.functionType === "split") && (
                <div className="p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Select Criteria</h2>
                    <CriteriaSelect
                        selected={selectedCriteria}
                        setSelected={setSelectedCriteria}
                    />
                </div>
            )}

            {/* Section 2: Playlist Selection */}
            <div className="p-6 rounded-lg pb-32">
                <h2 className="text-xl font-bold mb-4">Select Playlist</h2>

                <Tabs
                    selectedKey={selectionMethod}
                    onSelectionChange={(key) => setSelectionMethod(key as string)}
                >
                    <Tab key="my-playlists" title="My Playlists">
                        <div className="gap-2 grid grid-cols-6 mt-4">
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
                                    <CardFooter
                                        className="text-small justify-center overflow-hidden"
                                        style={{ maxWidth: "200px" }}
                                    >
                                        <div className="truncate text-center w-full">
                                            <b>{playlist.name}</b>
                                        </div>
                                    </CardFooter>
                                    <CardBody className="">
                                        <Image
                                            shadow="sm"
                                            className="object-scale-down h-[150px]"
                                            src={
                                                playlist.images[0]?.url ||
                                                "/default-playlist.png"
                                            }
                                        />
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    </Tab>
                    <Tab key="external-link" title="External Playlist">
                        <div className="mt-4 ">
                            <LinkInput
                                selected={playlistLink}
                                setSelected={setPlaylistLink}
                            />
                            <p className="text-sm text-gray-500 mt-2 w-full text-center">
                                Note: Only public Spotify playlists are supported
                            </p>
                        </div>
                    </Tab>
                </Tabs>
            </div>

            {/* Submit Button */}
            <div className="fixed bottom-8 z-50 left-1/2 transform -translate-x-1/2">
                <Button
                    onPress={handleSubmit}
                    className="hover:bg-blue-500 justify-center items-center mt-4 text-white py-3 px-8 rounded-lg text-2xl shadow-lg font-bold"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Spinner size="sm" color="white" />
                            <span>PROCESSING...</span>
                        </div>
                    ) : (
                        headers.functionType.toUpperCase()
                    )}
                </Button>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                playlistName={newPlaylistName}
                setPlaylistName={setNewPlaylistName}
                isPublic={isPublic}
                setIsPublic={setIsPublic}
                shuffle={shuffle}
                setShuffle={setShuffle}
                selectedPlaylistNames={
                    selectionMethod === "my-playlists"
                        ? selectedPlaylistNames
                        : [playlistLink]
                }
                functionType={headers.functionType}
            />
        </div>
    );
}
