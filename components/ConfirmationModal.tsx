import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Checkbox,
} from "@heroui/react";

type ConfirmationModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    playlistName: string;
    setPlaylistName: React.Dispatch<React.SetStateAction<string>>;
    isPublic: boolean;
    setIsPublic: React.Dispatch<React.SetStateAction<boolean>>;
    shuffle: boolean;
    setShuffle: React.Dispatch<React.SetStateAction<boolean>>;
    selectedPlaylistNames: string[];
    functionType: string;
};

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    playlistName,
    setPlaylistName,
    isPublic,
    setIsPublic,
    shuffle,
    setShuffle,
    selectedPlaylistNames,
    functionType,
}: ConfirmationModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    Confirm {functionType}
                </ModalHeader>
                <ModalBody>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">
                            Selected Playlists:
                        </h3>
                        <ul className="list-disc pl-5 mb-4">
                            {selectedPlaylistNames.map((name, index) => (
                                <li key={index}>{name}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="New Playlist Name"
                            placeholder="Enter a name for your new playlist"
                            value={playlistName}
                            onValueChange={setPlaylistName}
                        />

                        <div className="flex flex-col gap-2">
                            <Checkbox isSelected={isPublic} onValueChange={setIsPublic}>
                                Make playlist public
                            </Checkbox>

                            <Checkbox isSelected={shuffle} onValueChange={setShuffle}>
                                Shuffle songs
                            </Checkbox>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button color="primary" onPress={onConfirm}>
                        Confirm
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
