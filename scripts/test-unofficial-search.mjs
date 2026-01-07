/**
 * YouTube Search Script - Unofficial API
 *
 * Searches YouTube and extracts video/channel/playlist information.
 *
 * Usage:
 *   node test-unofficial-search.mjs "search query" [type] [duration] [maxResults]
 *
 * Parameters:
 *   search query: The search terms (required)
 *   type: Filter by content type - "video" (default), "channel", or "playlist"
 *   duration: Filter by video duration - "short" (<4min), "long" (>20min), or "any" (default)
 *   maxResults: Maximum number of results to fetch (default: 20, use "all" for unlimited)
 *
 * Examples:
 *   node test-unofficial-search.mjs "lofi hip hop"
 *   node test-unofficial-search.mjs "jazz piano" video long 50
 *   node test-unofficial-search.mjs "music" channel all
 *   node test-unofficial-search.mjs "tutorial" video short 100
 */

// Get search query, type, duration, and max results from command line arguments
const searchQuery = process.argv[2] || "lofi hip hop";
const searchType = process.argv[3] || "video"; // Default to video type
const searchDuration = process.argv[4] || "any"; // Default to any duration
const maxResultsArg = process.argv[5] || "20"; // Default to 20 results
const maxResults = maxResultsArg === "all" ? Infinity : parseInt(maxResultsArg, 10) || 20;

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
  `Searching for: "${searchQuery}" (type: ${searchType}, duration: ${searchDuration}, max results: ${maxResults === Infinity ? 'all' : maxResults})`
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

// Function to fetch continuation results for pagination
const fetchContinuationResults = async (continuationToken, visitorData) => {
  const continuationUrl = "https://www.youtube.com/youtubei/v1/search";

  const payload = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20240101.01.00",
        visitorData: visitorData || "",
      },
    },
    continuation: continuationToken,
  };

  const response = await fetch(continuationUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; YouTubeMuse/1.0; +https://example.com)",
      "Accept-Language": "en-US,en;q=0.9",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Continuation request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

// Function to extract items from a section
const extractItemsFromSection = (section) => {
  const items = section?.itemSectionRenderer?.contents ?? [];
  const results = [];

  for (const item of items) {
    if (searchType === "video" || !searchType || searchType === "video") {
      // Handle video results
      const videoRenderer = item?.videoRenderer;
      if (videoRenderer) {
        results.push({
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
        results.push({
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
        results.push({
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

  return results;
};

// Initial request
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

// Extract visitor data for continuation requests
const visitorDataJson = extractJsonBlock(html, "ytcfg.set");
const visitorDataMatch = visitorDataJson.match(/"VISITOR_DATA":"([^"]+)"/);
const visitorData = visitorDataMatch ? visitorDataMatch[1] : "";

// Extract search results from the primary contents
const primaryContents =
  initialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents
    ?.sectionListRenderer?.contents ?? [];

const videos = [];
let continuationToken = null;

// Process initial results
for (const section of primaryContents) {
  videos.push(...extractItemsFromSection(section));

  // Check for continuation token
  if (section?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
    continuationToken = section.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
  }
}

// Continue fetching more pages if needed and available
while (videos.length < maxResults && continuationToken) {
  console.log(`Fetched ${videos.length} results so far, continuing with token...`);

  try {
    const continuationData = await fetchContinuationResults(continuationToken, visitorData);

    // Extract results from continuation response
    const continuationContents = continuationData?.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems ?? [];

    for (const section of continuationContents) {
      videos.push(...extractItemsFromSection(section));

      // Check for next continuation token
      if (section?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
        continuationToken = section.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
      } else {
        continuationToken = null;
        break;
      }

      // Stop if we've reached the desired number of results
      if (videos.length >= maxResults) {
        break;
      }
    }
  } catch (error) {
    console.error(`Error fetching continuation: ${error.message}`);
    break;
  }
}

// Trim results to maxResults if needed
if (videos.length > maxResults) {
  videos.splice(maxResults);
}

console.log(`Total results found: ${videos.length}`);

// console.log(JSON.stringify(videos, null, 2));

/*

Return format: Array of search results (videos, channels, or playlists)

Video results:
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

Channel results:
[{
    "channelId": "UCvJJ_dzjViJCoLf5uKUTwoA",
    "title": "CNBC",
    "channelTitle": "CNBC",
    "description": "Breaking business news...",
    "subscriberCount": "2.5M subscribers",
    "videoCount": "15K videos",
    "thumbnail": "https://yt3.ggpht.com/...",
    "url": "https://www.youtube.com/channel/UCvJJ_dzjViJCoLf5uKUTwoA"
}, ...]

Playlist results:
[{
    "playlistId": "PLrAXtmRdnEQy...",
    "title": "My Favorite Songs",
    "channelTitle": "Music Channel",
    "channelId": "UCvJJ_dzjViJCoLf5uKUTwoA",
    "videoCount": "25",
    "thumbnail": "https://i.ytimg.com/vi/...",
    "url": "https://www.youtube.com/playlist?list=PLrAXtmRdnEQy..."
}, ...]
*/