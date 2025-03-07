# Playlistify

Playlistify is a web application that enhances your Spotify playlist management experience. Try it out at [playlistify-omega.vercel.app](https://playlistify-omega.vercel.app/)

## Features

-   **Clean**: Replace explicit songs from playlists with clean versions
-   **Sort**: Organize playlists by various criteria including:
    -   Artist
    -   Album
    -   Year
    -   Popularity
    -   Custom grouping options
-   **Split**: Divide playlists based on specific criteria

## Getting Started

### Prerequisites

-   Node.js
-   A Spotify Developer account
-   Spotify API credentials

### Local Development

1. Clone the repository

```bash
git clone https://github.com/yourusername/playlistify.git
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file with the following variables:

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI="http://localhost:3000/callback"
SPOTIFY_TOKEN_URL="https://accounts.spotify.com/api/token"
APP_SECRET="your_app_secret"
```

4. Start the development server

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Built With

-   [Next.js](https://nextjs.org/) - React framework
-   [Spotify Web API](https://developer.spotify.com/documentation/web-api/) - Spotify integration
-   [Tailwind CSS](https://tailwindcss.com/) - Styling
-   [NextUI](https://nextui.org/) - UI components

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

-   Thanks to Spotify for providing the API
-   Built with Next.js and deployed on Vercel
