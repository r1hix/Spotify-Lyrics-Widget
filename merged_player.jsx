import { run, React, styled } from "uebersicht";

// - WIDGET SETTINGS -
const isSquareLayout = false; // Set to true for 1:1 player
const MAX_CACHE_SIZE = 50;    // Nax number of songs to keep in memory
const useAlbumColorForLyrics = true; // If true, lyrics will use the dominant color of the album art for styling
const useVibrantColor = true; // If true, uses the most vibrant color in the album art for lyrics color. If false, averages all pixels - `useAlbumColorForLyrics` must be true
const defaultLyricsColor = '#fff'; // Fallback color for lyrics if album art color can't be determined or is disabled

// - APPLE SCRIPT -
export const command = `
osascript -e '
  if application "Spotify" is running then
    tell application "Spotify"
      if player state is playing or player state is paused then
        set trackName to name of current track
        set artistName to artist of current track
        set albumName to album of current track
        set albumArt to artwork url of current track
        set playerState to player state as string
        set playerPosition to player position
        return trackName & "%%" & artistName & "%%" & albumName & "%%" & albumArt & "%%" & playerState & "%%" & playerPosition
      else
        return "Not playing"
      end if
    end tell
  else
    return "Spotify not running"
  end if
'
`

export const refreshFrequency = (output) => {
  if (output.includes("%%paused%%")) {
    return 30000; // Refresh every 30 seconds when paused
  }
  // Refresh every second when playing
  return 1000; 
};

// - STYLING COMPONENTS -

const fadeIn = `@keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`;

// - Player Styles -
const PlayerContainer = styled('div')`
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #fff;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 15px;
  width: 400px;
  height: 180px;
  transition: all 0.4s ease-in-out;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  ${(props) => props.isSquare &&`
    width: 200px;
    height: 200px;
  `}
`;

const MainContent = styled('div')`
  display: flex;
  align-items: center;
  width: 100%;
`;

const AlbumArt = styled('div')`
  width: 150px;
  height: 150px;
  min-width: 150px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  background-size: cover;
  background-position: center;
  transition: all 0.3s ease-in-out;
  ${(props) => props.isSquare &&`
    width: 180px;
    height: 180px;
  `}
`;

const Info = styled('div')`
  padding-left: 15px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 150px;
  justify-content: space-between;

  ${(props) => props.isSquare &&`
    position: absolute; bottom: 10px; left: 10px; right: 10px;
    width: auto; height: auto; padding: 10px;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(12px); 
    border-radius: 8px; justify-content: center;
  `}
`;

const TrackInfo = styled('div')`
  animation: fade-in 0.4s ease-out;
  animation-fill-mode: both;
  margin-top: 10px;
  ${(props) => props.isSquare &&`display: none;`}
`;

const Title = styled('div')`
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Text = styled('div')`
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 5px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.9;
  &.album { font-size: 14px; font-weight: 400; opacity: 0.7; }
`;

const Controls = styled('div')`
  display: flex;
  align-items: center;
  ${(props) => props.isSquare &&`margin-top: 0; justify-content: center;`}
  button {
    background: none; border: none; color: #fff; cursor: pointer; opacity: 0.8;
    transition: opacity 0.2s, transform 0.2s; padding: 5px; display: flex;
    align-items: center; justify-content: center; margin: 0 10px;
    &:hover { opacity: 1; transform: scale(1.1); }
    &:first-of-type { margin-left: -5px; }
    svg { width: 20px; height: 20px; fill: currentColor; }
  }
`;

// - Lyrics -
const LyricsContainer = styled("div")`
  position: fixed;
  bottom: 50px;
  left: 50%;
  width: 80%;
  max-width: 900px;
  user-select: none;
  cursor: default;
  opacity: 0;
  transform: translate(-50%, 20px);
  pointer-events: none;
  transition: all 0.4s ease-in-out;
  
  ${(props) => props.isVisible && `
    opacity: 1;
    transform: translateX(-50%);
    pointer-events: auto;
  `}
`;

const LyricsWindow = styled("div")`
  height: 120px;
  overflow: hidden;
  position: relative;
`;

const LyricsSlider = styled("div")`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  text-align: center;
  transform: translateY(${(props) => props.offset}px);
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
`;

const LyricLine = styled("p")`
  margin: 0;
  font-weight: 500;
  line-height: 40px; 
  font-size: 20px;
  opacity: 0.5;
  filter: blur(1px);
  color: #fff;
  font-family: -apple-system, sans-serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  ${(props) => props.isCurrent && `
      opacity: 1; 
      filter: none; 
      font-size: 28px; 
      transform: scale(1.05);
      color: ${props.activeColor || '#fff'};
      text-shadow: 0 0 20px ${props.activeColor || 'rgba(255,255,255,0.5)'}, 0 2px 4px rgba(0,0,0,0.8);
    `}
`;

const LyricsStatus = styled("div")`
  font-size: 18px;
  opacity: 0.7;
  text-align: center;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

// - ICONS -
const IconPrevious = ( <svg viewBox="0 0 24 24"><path d="M18.15 17.38V6.62a1.25 1.25 0 00-2.06-.91l-7.42 5.38a1.25 1.25 0 000 1.82l7.42 5.38a1.25 1.25 0 002.06-.91zM5.85 6.12a.5.5 0 00-.5.5v10.75a.5.5 0 00.5.5.5.5 0 00.5-.5V6.62a.5.5 0 00-.5-.5z"/></svg> );
const IconNext = ( <svg viewBox="0 0 24 24"><path d="M5.85 6.62v10.75a1.25 1.25 0 002.06.91l7.42-5.38a1.25 1.25 0 000-1.82L7.91 5.71a1.25 1.25 0 00-2.06.91zM18.15 17.88a.5.5 0 00.5-.5V6.62a.5.5 0 00-.5-.5.5.5 0 00-.5.5v10.75a.5.5 0 00.5.5z"/></svg> );
const IconPlay = ( <svg viewBox="0 0 24 24"><path d="M7.12 21.29a1.25 1.25 0 01-1.25-1.25V3.96a1.25 1.25 0 011.87-1.09l12.89 8.04a1.25 1.25 0 010 2.18l-12.89 8.04a1.23 1.23 0 01-.62.16z"/></svg> );
const IconPause = ( <svg viewBox="0 0 24 24"><path d="M8.38 4.62H5.5a1 1 0 00-1 1v12.75a1 1 0 001 1h2.88a1 1 0 001-1V5.62a1 1 0 00-1-1zm10.12 0h-2.88a1 1 0 00-1 1v12.75a1 1 0 001 1h2.88a1 1 0 001-1V5.62a1 1 0 00-1-1z"/></svg> );
const IconLyrics = ( <svg viewBox="0 0 24 24"><path d="M15.5 4.15a.5.5 0 00-.5.5v12.2a3.25 3.25 0 00-2.5-1.23c-1.8 0-3.25 1.46-3.25 3.25S10.7 22.12 12.5 22.12S15.75 20.66 15.75 18.87V7.8l5.4-1.62a.5.5 0 00.35-.47V4.15a.5.5 0 00-.5-.5h-5.5z"/></svg> );

// - HELPER FUNCTIONS -
const runAppleScript = (script) => run(`osascript -e '${script}'`);

const parseLRC = (lrcText) => {
  if (!lrcText) return [];
  const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;  // [mm:ss.xx] or [mm:ss.xxx]
  return lrcText.split("\n").map(line => {
    const match = line.match(regex);
    if (!match) return null;
    const [, minutes, seconds, milliseconds, text] = match;
    const time = parseInt(minutes) * 60 + parseInt(seconds) + parseInt(milliseconds) / 1000;
    return { time, text: text.trim() }; // Trim whitespaces 
  }).filter(Boolean);
};

const getAverageColor = (imageUrl, callback) => {
  if (!imageUrl) return callback(defaultLyricsColor);
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    callback(`rgb(${r}, ${g}, ${b})`);
  };
  img.onerror = () => callback(defaultLyricsColor);
  img.src = imageUrl;
};

const getVibrantColor = (imageUrl, callback) => {
  if (!imageUrl) return callback(defaultLyricsColor);
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;

    // RGB to HSL
    const rgbToHsl = (r, g, b) => {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      if (max === min)
        h = s = 0;
      else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      return [h, s, l];
    };

    // Score each pixel: prefer high saturation, penalize near-black and near-white
    let candidates = [];
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a < 128) continue; // skip transparent
      const [h, s, l] = rgbToHsl(r, g, b);
      // Bell Curve: Peak score at l=0.5, near-zero at l<0.1 or l>0.9
      const lightScore = 1 - Math.abs(l - 0.5) * 2;
      const score = s * lightScore; // weight saturation heavily
      if (score > 0.05) candidates.push({ h, s, l, score, r, g, b });
    }

    if (candidates.length === 0) return callback(defaultLyricsColor);

    // Sort by score, take top 10%
    candidates.sort((a, b) => b.score - a.score);
    const top = candidates.slice(0, Math.max(1, Math.floor(candidates.length * 0.1)));

    // Average the top candidates
    const avg = top.reduce((acc, c) => {
      acc.r += c.r; acc.g += c.g; acc.b += c.b;
      return acc;
    }, { r: 0, g: 0, b: 0 });

    const n = top.length;
    callback(`rgb(${Math.round(avg.r/n)}, ${Math.round(avg.g/n)}, ${Math.round(avg.b/n)})`);
  };
  img.onerror = () => callback(defaultLyricsColor);
  img.src = imageUrl;
};

// - LYRICS CACHE -
const CACHE_KEY = 'spotify-lyrics-cache-v1';

let initialCache = [];
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const stored = window.localStorage.getItem(CACHE_KEY);
    if (stored) initialCache = JSON.parse(stored);
  } catch (e) {
  }
}

const lyricsCache = new Map(initialCache);

const saveCacheToStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const jsonStr = JSON.stringify(Array.from(lyricsCache.entries()));
      window.localStorage.setItem(CACHE_KEY, jsonStr);
    } catch (e) {
    }
  }
};

const fetchLyrics = async (track, artist, callback) => {
  const cacheKey = `${track}-${artist}`;

  // Check cache first
  if (lyricsCache.has(cacheKey)) {
    const cachedLyrics = lyricsCache.get(cacheKey);
    // Move to front (most recently used)
    lyricsCache.delete(cacheKey);
    lyricsCache.set(cacheKey, cachedLyrics);
    saveCacheToStorage(); // Save the new order
    
    callback({ status: '', lines: cachedLyrics });
    return;
  }

// Fetch from API if not in cache
  try {
    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track)}&artist_name=${encodeURIComponent(artist)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    
    if (data && data.syncedLyrics) {
        const parsedLyrics = parseLRC(data.syncedLyrics);
        if (parsedLyrics.length > 0) {

            if (lyricsCache.size >= MAX_CACHE_SIZE) {
               const oldestKey = lyricsCache.keys().next().value;
               lyricsCache.delete(oldestKey);
            }
            
            lyricsCache.set(cacheKey, parsedLyrics);
            saveCacheToStorage();
            
            callback({ status: '', lines: parsedLyrics }); 

        } else throw new Error('Synced lyrics format was invalid.');
    } else throw new Error('No synced lyrics found for this track.');
  } catch (error) {
    if (lyricsCache.has(cacheKey)) {
      callback({ status: '', lines: lyricsCache.get(cacheKey) });
    } else {
      callback({ status: 'Could not load lyrics', lines: [] });
    }
  }
};

// - MAIN COMPONENT -
const SpotifyWidget = ({ output }) => {
  const [lyricsVisible, setLyricsVisible] = React.useState(true);
  const [lyrics, setLyrics] = React.useState({ status: 'Loading...', lines: [] });
  const [dominantColor, setDominantColor] = React.useState('#fff');
  
  // Ref to hold the pause timer ID
  const pauseTimer = React.useRef(null);

  const [trackName, artistName, albumName, albumArt, playerState, positionStr] = output.split("%%");
  const position = parseFloat(positionStr);
  
  // - UPDATE LYRICS -
  React.useEffect(() => {
    if (!lyricsCache.has(`${trackName}-${artistName}`)) {
        setLyrics({ status: `Fetching lyrics for "${trackName}"...`, lines: [] });
    }
    fetchLyrics(trackName, artistName, setLyrics);
  }, [trackName, artistName]);

  // - AUTO-HIDE LYRICS -
  React.useEffect(() => {
    // Reset any existing timers when state changes
    clearTimeout(pauseTimer.current);

    // If paused and lyrics are visible, start the timer to hide lyrics
    if (playerState === 'paused' && lyricsVisible) {
      pauseTimer.current = setTimeout(() => {
        setLyricsVisible(false);
      }, 60000); // 60 seconds
    }
    
    // Cleanup function to clear timer on next effect run
    return () => clearTimeout(pauseTimer.current);
  }, [playerState, lyricsVisible]);

  // - GET DOMINANT COLOR FROM ALBUM ART -
  React.useEffect(() => {
    if (!useAlbumColorForLyrics || !albumArt || !albumArt.startsWith('http')) {
      return setDominantColor(defaultLyricsColor);
    }
    const lyricsColor = useVibrantColor ? getVibrantColor : getAverageColor;
    lyricsColor(albumArt, setDominantColor);
  }, [albumArt]);


  const showAlbumName = trackName.toLowerCase() !== albumName.toLowerCase() && !albumName.toLowerCase().includes('single');
  const playPauseIcon = playerState === 'playing' ? IconPause : IconPlay;

  let currentIndex = -1;
  if (lyrics.lines.length > 0) {
    currentIndex = lyrics.lines.findIndex(line => line.time > position) - 1;
    if (currentIndex < -1) currentIndex = -1;
    else if (currentIndex === -2) currentIndex = lyrics.lines.length - 1;
  }
  const offset = -(currentIndex * 40) + (120 / 2) - (40 / 2); 

  return (
    <>
      <PlayerContainer isSquare={isSquareLayout}>
        <MainContent>
          <AlbumArt style={{ backgroundImage: `url(${albumArt})` }} isSquare={isSquareLayout} />
          <Info isSquare={isSquareLayout}>
            <TrackInfo isSquare={isSquareLayout}>
              <Title>{trackName}</Title>
              <Text>{artistName}</Text>
              {showAlbumName && <Text className="album">{albumName}</Text>}
            </TrackInfo>
            <Controls isSquare={isSquareLayout}>
              <button onClick={() => runAppleScript('tell application "Spotify" to previous track')}>{IconPrevious}</button>
              <button onClick={() => runAppleScript('tell application "Spotify" to playpause')}>{playPauseIcon}</button>
              <button onClick={() => runAppleScript('tell application "Spotify" to next track')}>{IconNext}</button>
              {!isSquareLayout && (
                <button onClick={() => setLyricsVisible(!lyricsVisible)}>{IconLyrics}</button>
              )}
            </Controls>
          </Info>
        </MainContent>
      </PlayerContainer>

      <LyricsContainer isVisible={lyricsVisible}>
        {lyrics.lines.length > 0 ? (
          <LyricsWindow>
            <LyricsSlider offset={offset}>
              {lyrics.lines.map((line, i) => (
                <LyricLine key={`${line.time}-${i}`} isCurrent={i === currentIndex} activeColor={dominantColor}>
                  {line.text || "\u00A0"}
                </LyricLine>
              ))}
            </LyricsSlider>
          </LyricsWindow>
        ) : (
          <LyricsStatus>{lyrics.status}</LyricsStatus>
        )}
      </LyricsContainer>
    </>
  );
};

// - RENDER FUNCTION -
export const render = ({ output, error }) => {
  if (typeof window !== 'undefined' && !document.getElementById('spotify-widget-styles')) {
    const style = document.createElement('style');
    style.id = 'spotify-widget-styles';
    style.innerHTML = fadeIn;
    document.head.appendChild(style);
  }

  if (error) return <div>Error: {String(error)}</div>;
  const trimmedOutput = output.trim();
  if (trimmedOutput === "Spotify not running" || trimmedOutput === "Not playing" || trimmedOutput === "") {
    return <></>; 
  }
  
  return <SpotifyWidget output={trimmedOutput} />;
};