// src/services/artist-count-for-playlist.js
import { fetchPlaylistById } from '../api/spotify-playlists.js';

/**
 * Compte le nombre d'apparitions de chaque artiste dans une playlist Spotify.
 *
 * @param {string} token - Token d'accès Spotify (Bearer token).
 * @param {string} playlistId - ID de la playlist Spotify.
 * @returns {Promise<Record<string, number>>} - Un objet { [artistName]: count }
 */
export async function artistCountForPlaylist(token, playlistId) {
  if (!token) {
    throw new Error("Spotify access token is required");
  }

  if (!playlistId) {
    throw new Error("Playlist id is required");
  }

  try {
    const { data, error } = await fetchPlaylistById(token, playlistId);

    if (error) {
      console.error(`Error fetching playlist with id ${playlistId}`, error);
      return undefined;
    }

    const items = data?.tracks?.items ?? [];

    const artistCountMap = {};

    for (const item of items) {
      const track = item?.track;
      const artists = track?.artists ?? [];

      for (const artist of artists) {
        const name = artist?.name;
        if (!name) continue;

        artistCountMap[name] = (artistCountMap[name] || 0) + 1;
      }
    }

    return artistCountMap;
  } catch (error) {
    console.error(`Error fetching playlist with id ${playlistId}`, error);
    return undefined;
  }
}
export default artistCountForPlaylist;
