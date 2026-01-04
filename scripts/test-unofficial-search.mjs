/**
 * YouTube Search Script - Unofficial API
 *
 * Searches YouTube and extracts video/channel/playlist information.
 *
 * Usage:
 *   node test-unofficial-search.mjs "search query" [type] [duration]
 *
 * Parameters:
 *   search query: The search terms (required)
 *   type: Filter by content type - "video" (default), "channel", or "playlist"
 *   duration: Filter by video duration - "short" (<4min), "long" (>20min), or "any" (default)
 *
 * Examples:
 *   node test-unofficial-search.mjs "lofi hip hop"
 *   node test-unofficial-search.mjs "jazz piano" video long
 *   node test-unofficial-search.mjs "music" channel
 *   node test-unofficial-search.mjs "tutorial" video short
 */

// Get search query, type, and duration from command line arguments
const searchQuery = process.argv[2] || "lofi hip hop";
const searchType = process.argv[3] || "video"; // Default to video type
const searchDuration = process.argv[4] || "any"; // Default to any duration

// YouTube search filter parameters for different content types
const typeFilters = {
  video: "EgIQAQ%3D%3D", // Videos only
  channel: "EgIQAg%3D%3D", // Channels only
  playlist: "EgIQAw%3D%3D", // Playlists only
  movie: "EgIQBA%3D%3D", // Movies only
};

// YouTube duration filter parameters (only applies to videos)
const durationFilters = {
  short: "EgQQARAB", // Short videos (<4 minutes)
  long: "EgQQARAC", // Long videos (>20 minutes)
  any: "", // Any duration (no filter)
};

let spParam = typeFilters[searchType] || typeFilters.video;

// Add duration filter for video searches
if (searchType === "video" && searchDuration !== "any") {
  const durationParam = durationFilters[searchDuration];
  if (durationParam) {
    spParam = spParam + durationParam;
  }
}

const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}&sp=${spParam}`;

console.log(
  `Searching for: "${searchQuery}" (type: ${searchType}, duration: ${searchDuration})`
);

const extractJsonBlock = (html, marker) => {
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Marker not found: ${marker}`);
  }

  const startIndex = html.indexOf("{", markerIndex);
  if (startIndex === -1) {
    throw new Error(`JSON start not found for: ${marker}`);
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = startIndex; i < html.length; i += 1) {
    const char = html[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return html.slice(startIndex, i + 1);
      }
    }
  }

  throw new Error(`JSON end not found for: ${marker}`);
};

const response = await fetch(url, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; YouTubeMuse/1.0; +https://example.com)",
    "Accept-Language": "en-US,en;q=0.9",
  },
});

if (!response.ok) {
  throw new Error(`Request failed: ${response.status} ${response.statusText}`);
}

const html = await response.text();
const initialDataJson = extractJsonBlock(html, "ytInitialData");
const initialData = JSON.parse(initialDataJson);

// Extract search results from the primary contents
const primaryContents =
  initialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents
    ?.sectionListRenderer?.contents ?? [];

const videos = [];

// Process each section in the search results
for (const section of primaryContents) {
  const items = section?.itemSectionRenderer?.contents ?? [];

  for (const item of items) {
    if (searchType === "video" || !searchType || searchType === "video") {
      // Handle video results
      const videoRenderer = item?.videoRenderer;
      if (videoRenderer) {
        videos.push({
          videoId: videoRenderer.videoId,
          title: videoRenderer.title?.runs?.[0]?.text ?? "",
          channelTitle: videoRenderer.ownerText?.runs?.[0]?.text ?? "",
          channelId:
            videoRenderer.ownerText?.runs?.[0]?.navigationEndpoint
              ?.browseEndpoint?.browseId ?? "",
          publishedTime: videoRenderer.publishedTimeText?.simpleText ?? "",
          viewCount: videoRenderer.viewCountText?.simpleText ?? "",
          lengthText: videoRenderer.lengthText?.simpleText ?? "",
          thumbnail: videoRenderer.thumbnail?.thumbnails?.[0]?.url ?? "",
          url: `https://www.youtube.com/watch?v=${videoRenderer.videoId}`,
        });
      }
    } else if (searchType === "channel") {
      // Handle channel results
      const channelRenderer = item?.channelRenderer;
      if (channelRenderer) {
        videos.push({
          channelId: channelRenderer.channelId,
          title: channelRenderer.title?.simpleText ?? "",
          channelTitle: channelRenderer.title?.simpleText ?? "",
          description:
            channelRenderer.descriptionSnippet?.runs?.[0]?.text ?? "",
          subscriberCount:
            channelRenderer.subscriberCountText?.simpleText ?? "",
          videoCount: channelRenderer.videoCountText?.simpleText ?? "",
          thumbnail: channelRenderer.thumbnail?.thumbnails?.[0]?.url ?? "",
          url: `https://www.youtube.com/channel/${channelRenderer.channelId}`,
        });
      }
    } else if (searchType === "playlist") {
      // Handle playlist results
      const playlistRenderer = item?.playlistRenderer;
      if (playlistRenderer) {
        videos.push({
          playlistId: playlistRenderer.playlistId,
          title: playlistRenderer.title?.simpleText ?? "",
          channelTitle: playlistRenderer.ownerText?.runs?.[0]?.text ?? "",
          channelId:
            playlistRenderer.ownerText?.runs?.[0]?.navigationEndpoint
              ?.browseEndpoint?.browseId ?? "",
          videoCount: playlistRenderer.videoCount ?? "",
          thumbnail:
            playlistRenderer.thumbnails?.[0]?.thumbnails?.[0]?.url ?? "",
          url: `https://www.youtube.com/playlist?list=${playlistRenderer.playlistId}`,
        });
      }
    }
  }
}

console.log(JSON.stringify(videos, null, 2));

/*

Return format:

[{
    "videoId": "oLDcbkEqi-M",
    "title": "Why The AI Boom Might Be A Bubble?",
    "channelTitle": "CNBC",
    "channelId": "UCvJJ_dzjViJCoLf5uKUTwoA",
    "publishedTime": "2 months ago",
    "viewCount": "560,830 views",
    "lengthText": "9:37",
    "thumbnail": "https://i.ytimg.com/vi/oLDcbkEqi-M/hq720.jpg?sqp=-oaymwEjCOgCEMoBSFryq4qpAxUIARUAAAAAGAElAADIQj0AgKJDeAE=&rs=AOn4CLBP5ljhjaQ5UXWH1sHA2FOrOjMJFQ",
    "url": "https://www.youtube.com/watch?v=oLDcbkEqi-M"
}, ...]
*/