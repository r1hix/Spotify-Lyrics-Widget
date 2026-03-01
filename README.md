# 🎧 Spotify Player + Lyrics Widget for Übersicht

A sleek, blur-styled **Spotify player widget** for [Übersicht](https://tracesof.net/uebersicht/) that displays the currently playing track with synced lyrics fetched from [LRCLIB.net](https://lrclib.net).
Built with React, styled-components, and AppleScript for macOS.

![screenshot](player_screenshot.png)
![screenshot0](lyrics_screenshot.png)
![screenshot1](colored_lyrics_screenshot.png)

---

## ✨ Features

* 🎶 **Real-time Spotify playback info** (track, artist, album, artwork)
* 🧾 **Synced lyrics display** via [lrclib.net](https://lrclib.net)
* 🎨 Dynamic Lyric Colors that automatically extract and adapt to the dominant color of the current album artwork
* 💾 Persistent Lyrics Cache saves previously fetched lyrics to local storage for instant, rate-limit-free loading on repeat listens
* 🎛️ **Playback controls** (previous, play/pause, next)
* 💨 **Animated lyrics** that auto-scroll in sync with the song
* 🌫️ **Modern glassy design** with smooth fade and blur effects
* 🟪 **Two layouts** — rectangular and 1:1 square (toggle in code)
* 💤 **Auto-hide lyrics** when paused for 60 seconds

---

## 🧩 Installation

1.  Make sure you have [Übersicht](https://tracesof.net/uebersicht/) installed on macOS.

2.  Locate your widgets folder:
    ```
    ~/Library/Application Support/Übersicht/widgets/
    ```

3.  Clone or download this repository inside that folder:
    ```bash
    cd ~/Library/Application\ Support/Übersicht/widgets/
    git clone [https://github.com/RIHIxYT/spotify-lyrics-widget.git](https://github.com/RIHIxYT/spotify-lyrics-widget.git)
    ```

4.  Open Ubersicht and enable the widget:
    * Click the **Übersicht icon** in the menu bar
    * Choose **Widgets → Refresh all**

---

## ⚙️ Settings

You can adjust layout and refresh behavior directly in the code:

| Option | Default | Description |
| :--- | :--- | :--- |
| `isSquareLayout` | `false` | Switch between wide and 1:1 layout |
| `MAX_CACHE_SIZE` | `50` | Maximum number of parsed song lyrics to keep saved in local storage |
| `useAlbumColorForLyrics` | `true` | If true, active lyrics will use the dominant color of the album art for styling |
| `defaultLyricsColor` | `#fff` | Fallback color if useAlbumColorForLyrics is set to disabled |
| `refreshFrequency` | `1000ms` (playing) / `30000ms` (paused) | Adjusts how often data updates |

---

## 🧠 How It Works

* Uses **AppleScript** to communicate with the Spotify app.
* Periodically fetches song data (title, artist, album, artwork).
* Requests synced lyrics from **LRCLIB.net**.
* Caches fetched lyrics locally in the browser's localStorage for instant, offline retrieval.
* Extracts the dominant color of the cover art on-the-fly using a microscopic HTML5 Canvas.
* Smoothly animates lyric lines in time with the current playback position.

---

## 🛠️ Requirements

* **macOS**
* **Übersicht**
* **Spotify app** (must be running)
* **Internet connection** (for lyric fetching)

---

## 📜 License

This project is licensed under the **MIT License**.
Feel free to modify and improve — credit is appreciated.

---

## 💬 Author

Created by **r1hix**.
If you enjoy this widget, a ⭐ on GitHub would be awesome!

---

## ⚡ Future Ideas

* Support for Apple Music
* Compact mini-player mode