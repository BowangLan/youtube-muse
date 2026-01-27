/**
 * YouTube Channel Search Script - Unofficial API
 *
 * Searches YouTube specifically for channels and extracts channel information.
 *
 * Usage:
 *   node test-unofficial-channel-search.mjs "search query" [maxResults]
 *
 * Parameters:
 *   search query: The search terms (required)
 *   maxResults: Maximum number of results to fetch (default: 20, use "all" for unlimited)
 *
 * Examples:
 *   node test-unofficial-channel-search.mjs "lofi music"
 *   node test-unofficial-channel-search.mjs "cooking" 50
 *   node test-unofficial-channel-search.mjs "tech reviews" all
 */

// Get search query and max results from command line arguments
const searchQuery = process.argv[2] || "lofi music";
const maxResultsArg = process.argv[3] || "20";
const maxResults = maxResultsArg === "all" ? Infinity : parseInt(maxResultsArg, 10) || 20;

// YouTube search filter for channels only
const channelFilter = "EgIQAg%3D%3D";

const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}&sp=${channelFilter}`;

console.log(
  `Searching for channels: "${searchQuery}" (max results: ${maxResults === Infinity ? "all" : maxResults})`
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

// Function to extract channel items from a section
const extractChannelsFromSection = (section) => {
  const items = section?.itemSectionRenderer?.contents ?? [];
  const channels = [];

  for (const item of items) {
    const channelRenderer = item?.channelRenderer;
    if (channelRenderer) {
      // Get the best quality thumbnail (last one is usually highest res)
      const thumbnails = channelRenderer.thumbnail?.thumbnails ?? [];
      const bestThumbnail = thumbnails[thumbnails.length - 1]?.url ?? thumbnails[0]?.url ?? "";

      // Ensure thumbnail URL has protocol
      const thumbnailUrl = bestThumbnail.startsWith("//")
        ? `https:${bestThumbnail}`
        : bestThumbnail;

      // Extract custom URL from navigation endpoint (e.g., "/@t3dotgg")
      const customUrl =
        channelRenderer.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl ?? "";

      // YouTube's confusing naming convention:
      // - subscriberCountText.simpleText contains the HANDLE (e.g., "@t3dotgg")
      // - videoCountText.simpleText contains the SUBSCRIBER COUNT (e.g., "500K subscribers")
      const handle = channelRenderer.subscriberCountText?.simpleText ?? "";
      const subscriberCount = channelRenderer.videoCountText?.simpleText ?? "";

      // Description is in runs array
      const description =
        channelRenderer.descriptionSnippet?.runs?.map((r) => r.text).join("") ?? "";

      channels.push({
        channelId: channelRenderer.channelId,
        title: channelRenderer.title?.simpleText ?? "",
        handle: handle,
        customUrl: customUrl,
        description: description,
        subscriberCount: subscriberCount,
        thumbnail: thumbnailUrl,
        url: `https://www.youtube.com/channel/${channelRenderer.channelId}`,
      });
    }
  }

  return channels;
};

// Initial request
const response = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; YouTubeMuse/1.0; +https://example.com)",
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

const channels = [];
let continuationToken = null;

// Process initial results
for (const section of primaryContents) {
  channels.push(...extractChannelsFromSection(section));

  // Check for continuation token
  if (section?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
    continuationToken = section.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
  }
}

// Continue fetching more pages if needed and available
while (channels.length < maxResults && continuationToken) {
  console.log(`Fetched ${channels.length} channels so far, continuing...`);

  try {
    const continuationData = await fetchContinuationResults(continuationToken, visitorData);

    // Extract results from continuation response
    const continuationContents =
      continuationData?.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems ?? [];

    for (const section of continuationContents) {
      channels.push(...extractChannelsFromSection(section));

      // Check for next continuation token
      if (section?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
        continuationToken = section.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
      } else {
        continuationToken = null;
        break;
      }

      // Stop if we've reached the desired number of results
      if (channels.length >= maxResults) {
        break;
      }
    }
  } catch (error) {
    console.error(`Error fetching continuation: ${error.message}`);
    break;
  }
}

// Trim results to maxResults if needed
if (channels.length > maxResults) {
  channels.splice(maxResults);
}

console.log(`\nTotal channels found: ${channels.length}\n`);
console.log(JSON.stringify(channels, null, 2));

/*

Return format: Array of channel results

[{
    "channelId": "UCbRP3c757lWg9M-U7TyEkXA",
    "title": "Theo - t3.gg",
    "handle": "@t3dotgg",
    "customUrl": "/@t3dotgg",
    "description": "Software dev, AI nerd, TypeScript sympathizer...",
    "subscriberCount": "500K subscribers",
    "thumbnail": "https://yt3.ggpht.com/...",
    "url": "https://www.youtube.com/channel/UCbRP3c757lWg9M-U7TyEkXA"
}, ...]

*/
