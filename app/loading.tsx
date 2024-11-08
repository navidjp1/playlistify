import { CircularProgress } from "@nextui-org/progress";

// Show a loading indicator while the user data is being fetched
export default function LoadingPage() {
    return (
        <div className="flex items-center justify-center h-screen">
            <CircularProgress size="lg" aria-label="Loading..." />
        </div>
    );
}
