const ART: Record<string, string> = {
    "Meeting Rooms": "/art/meeting-rooms.webp",
    "Workspaces": "/art/workspaces.webp",
    "Studios & Labs": "/art/studios-labs.webp",
    "Equipment": "/art/equipment.webp",
    "Vehicles": "/art/vehicles.webp",
    "Parking": "/art/parking.webp",
};

export function categoryArt(categoryName: string): string | null {
    return ART[categoryName] ?? null;
}
