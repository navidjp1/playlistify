import React from "react";
import { Input } from "@heroui/react";

export default function LinkInput({
    selected,
    setSelected,
}: {
    selected: string;
    setSelected: React.Dispatch<React.SetStateAction<string>>;
}) {
    return (
        <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
            <Input
                label="Link"
                value={selected}
                onValueChange={setSelected}
                placeholder="Paste in the playlist link"
                type="link"
                className="items-center pb-6"
            />
        </div>
        // <div>
        //     <RadioGroup
        //         label="Sort by..."
        //         orientation="horizontal"
        //         className="items-center pt-4 pb-6"
        //         value={selected}
        //         onValueChange={setSelected}
        //     >
        //         <Radio value="genre">Genre</Radio>
        //         <Radio value="artist">Artist</Radio>
        //         <Radio value="popularity">Popularity</Radio>
        //         <Radio value="language">Language</Radio>
        //         <Radio value="date">Release Date</Radio>
        //     </RadioGroup>
        // </div>
    );
}
