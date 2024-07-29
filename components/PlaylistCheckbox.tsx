"use client";

import React, { useState, useEffect } from "react";
import { Checkbox, CheckboxGroup, Button } from "@nextui-org/react";
import { Playlist } from "@/utils/types";

type PlaylistCheckboxProps = {
    playlists: Playlist[];
    headers: {
        functionType: string;
        maxSelections: number;
    };
};

export default function PlaylistCheckbox({ playlists, headers }: PlaylistCheckboxProps) {
    const [selectedPlaylists, setSelectedPlaylists] = useState([]);

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
            const response = await fetch("http://localhost:3000/api/handle_functions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    selectedPlaylists,
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
        }
        console.log("Success!");
        setSelectedPlaylists([]);
    };

    return (
        <div>
            <CheckboxGroup
                color="primary"
                label="Select Playlists"
                value={selectedPlaylists}
                onChange={(e: any) => setSelectedPlaylists(e)}
            >
                {playlists.map((playlist: Playlist) => (
                    <Checkbox
                        key={playlist.id}
                        value={JSON.stringify({ id: playlist.id, name: playlist.name })}
                    >
                        {playlist.name}
                    </Checkbox>
                ))}
            </CheckboxGroup>
            <Button onClick={handleSubmit} className="mt-4">
                Submit
            </Button>
        </div>
    );
}
