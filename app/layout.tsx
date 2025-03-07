import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import "./globals.css";
import "@/utils/fontawesome";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Playlistify",
    description: "Additional features for your Spotify playlists",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <Providers>{children} </Providers>
                <Toaster richColors />
            </body>
        </html>
    );
}
