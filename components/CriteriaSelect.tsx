import React from "react";
import { RadioGroup, Radio } from "@heroui/react";
export default function CriteriaSelect({
    selected,
    setSelected,
}: {
    selected: string;
    setSelected: React.Dispatch<React.SetStateAction<string>>;
}) {
    return (
        <div>
            <RadioGroup
                label="Sort by..."
                orientation="horizontal"
                className="items-center pt-4 pb-6"
                value={selected}
                onValueChange={setSelected}
            >
                <Radio value="genre">Genre</Radio>
                <Radio value="artist">Artist</Radio>
                <Radio value="popularity">Popularity</Radio>
                <Radio value="language">Language</Radio>
                <Radio value="date">Release Date</Radio>
            </RadioGroup>
        </div>
    );
}
