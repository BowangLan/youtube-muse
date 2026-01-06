/**
 * YouTube Video Detail Script - Unofficial API
 *
 * Fetches detailed information for a single YouTube video given its URL.
 *
 * Usage:
 *   node test-unofficial-video-detail.mjs "https://www.youtube.com/watch?v=VIDEO_ID"
 *
 * Parameters:
 *   url: Full YouTube video URL (required)
 *
 * Examples:
 *   node test-unofficial-video-detail.mjs "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *   node test-unofficial-video-detail.mjs "https://youtu.be/dQw4w9WgXcQ"
 */

import { readFileSync } from "fs";

// Get YouTube URL from command line arguments
const youtubeUrl = process.argv[2];

if (!youtubeUrl) {
  console.error("Error: YouTube URL is required");
  console.error(
    'Usage: node test-unofficial-video-detail.mjs "https://www.youtube.com/watch?v=VIDEO_ID"'
  );
  process.exit(1);
}

// Extract video ID from YouTube URL
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  throw new Error("Invalid YouTube URL format");
}

let videoId;
try {
  videoId = extractVideoId(youtubeUrl);
  console.log(`Extracted video ID: ${videoId}`);
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

const url = `https://www.youtube.com/watch?v=${videoId}`;

console.log(`Fetching video details for: ${url}`);

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

// Traverse object to find channel thumbnail
function findChannelThumbnail(obj, path = []) {
  if (!obj || typeof obj !== "object") return null;

  // Check if this object has channel thumbnail properties
  if (
    obj.thumbnails &&
    Array.isArray(obj.thumbnails) &&
    obj.thumbnails.length > 0
  ) {
    // Look for yt3.ggpht.com URLs which are channel thumbnails
    for (const thumbnail of obj.thumbnails) {
      if (thumbnail.url && thumbnail.url.includes("yt3.ggpht.com")) {
        return thumbnail.url;
      }
    }
  }

  // Check for direct thumbnail URL properties
  if (
    obj.thumbnail &&
    obj.thumbnail.thumbnails &&
    Array.isArray(obj.thumbnail.thumbnails)
  ) {
    for (const thumbnail of obj.thumbnail.thumbnails) {
      if (thumbnail.url && thumbnail.url.includes("yt3.ggpht.com")) {
        return thumbnail.url;
      }
    }
  }

  // Check for avatar property
  if (
    obj.avatar &&
    obj.avatar.thumbnails &&
    Array.isArray(obj.avatar.thumbnails)
  ) {
    for (const thumbnail of obj.avatar.thumbnails) {
      if (thumbnail.url && thumbnail.url.includes("yt3.ggpht.com")) {
        return thumbnail.url;
      }
    }
  }

  // Recursively search nested objects
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const result = findChannelThumbnail(obj[key], [...path, key]);
      if (result) return result;
    }
  }

  return null;
}

// Traverse object to find subscriber count from sectionSubtitle
function findSubscriberCount(obj, path = []) {
  if (!obj || typeof obj !== "object") return null;

  // Check if this object has sectionSubtitle with simpleText
  if (obj.sectionSubtitle && obj.sectionSubtitle.simpleText) {
    // Check if the simpleText contains subscriber information
    const text = obj.sectionSubtitle.simpleText;
    if (
      text &&
      (text.includes("subscriber") || text.includes("K") || text.includes("M"))
    ) {
      return text;
    }
  }

  // Recursively search nested objects
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const result = findSubscriberCount(obj[key], [...path, key]);
      if (result) return result;
    }
  }

  return null;
}

// Traverse object to find channel canonical base URL from channelEndpoint
function findChannelCanonicalBaseUrl(obj, path = []) {
  if (!obj || typeof obj !== "object") return null;

  // Check if this object has channelEndpoint with browseEndpoint.canonicalBaseUrl
  if (
    obj.channelEndpoint &&
    obj.channelEndpoint.browseEndpoint &&
    obj.channelEndpoint.browseEndpoint.canonicalBaseUrl
  ) {
    return obj.channelEndpoint.browseEndpoint.canonicalBaseUrl;
  }

  // Recursively search nested objects
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const result = findChannelCanonicalBaseUrl(obj[key], [...path, key]);
      if (result) return result;
    }
  }

  return null;
}

// Field scrapers configuration
const FIELD_SCRAPERS = {
  // Basic video info from videoDetails
  videoId: {
    source: "static",
    extract: () => videoId,
  },
  title: {
    source: "videoDetails",
    extract: (data) => data.videoDetails?.title ?? "",
  },
  viewCount: {
    source: "videoDetails",
    extract: (data) => {
      const viewCount = data.videoDetails?.viewCount;
      if (viewCount) {
        // Remove commas and parse as integer
        const cleanCount = viewCount.toString().replace(/,/g, "");
        const parsed = parseInt(cleanCount, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    },
  },
  publishTime: {
    source: "microformat",
    extract: (data) => {
      const publishDate =
        data.microformat?.playerMicroformatRenderer?.publishDate;
      if (publishDate) {
        try {
          // Parse ISO 8601 date string (e.g., "2026-01-03T12:16:08-08:00")
          const date = new Date(publishDate);
          // Return timestamp in milliseconds since epoch
          return date.getTime();
        } catch (error) {
          console.warn("Failed to parse publish date:", publishDate, error);
          return 0;
        }
      }
      return 0;
    },
  },
  uploadDate: {
    source: "microformat",
    extract: (data) => {
      const uploadDate =
        data.microformat?.playerMicroformatRenderer?.uploadDate;
      if (uploadDate) {
        try {
          // Parse ISO 8601 date string (e.g., "2026-01-03T12:16:08-08:00")
          const date = new Date(uploadDate);
          // Return timestamp in milliseconds since epoch
          return date.getTime();
        } catch (error) {
          console.warn("Failed to parse upload date:", uploadDate, error);
          return 0;
        }
      }
      return 0;
    },
  },
  category: {
    source: "microformat",
    extract: (data) =>
      data.microformat?.playerMicroformatRenderer?.category ?? "",
  },

  // Like count from microformat
  likeCount: {
    source: "microformat",
    extract: (data) => {
      const likeCount = data.microformat?.playerMicroformatRenderer?.likeCount;
      if (likeCount) {
        // Remove commas and parse as integer
        const cleanCount = likeCount.toString().replace(/,/g, "");
        const parsed = parseInt(cleanCount, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    },
  },

  // Channel information from videoDetails
  channel: {
    source: "combined",
    extract: (data) => {
      const channelId = data.videoDetails?.channelId ?? "";
      const channelTitle = data.videoDetails?.author ?? "";
      const channelUrl = channelId
        ? `https://www.youtube.com/channel/${channelId}`
        : "";

      let subscriberCountText = "";
      if (data.ytInitialData) {
        subscriberCountText = findSubscriberCount(data.ytInitialData) || "";
      }

      let channelThumbnail = "";
      if (data.ytInitialData) {
        channelThumbnail = findChannelThumbnail(data.ytInitialData) || "";
      }

      let channelCanonicalBaseUrl = "";
      if (data.ytInitialData) {
        channelCanonicalBaseUrl =
          findChannelCanonicalBaseUrl(data.ytInitialData) || "";
      }

      return {
        id: channelId,
        title: channelTitle,
        url: channelUrl,
        canonicalBaseUrl: channelCanonicalBaseUrl,
        thumbnail: channelThumbnail,
        subscriberCountText: subscriberCountText,
      };
    },
  },

  // Description from videoDetails
  description: {
    source: "videoDetails",
    extract: (data) => data.videoDetails?.shortDescription ?? "",
  },

  // Duration from videoDetails
  durationSeconds: {
    source: "videoDetails",
    extract: (data) => parseInt(data.videoDetails?.lengthSeconds ?? 0),
  },

  // Thumbnail from videoDetails
  thumbnail: {
    source: "videoDetails",
    extract: (data) => {
      const thumbnails = data.videoDetails?.thumbnail?.thumbnails ?? [];
      if (thumbnails.length > 0) {
        // Sort by resolution and get the highest
        thumbnails.sort((a, b) => b.width * b.height - a.width * a.height);
        return thumbnails[0].url;
      }
      return "";
    },
  },

  // Static URL field
  url: {
    source: "static",
    extract: () => url,
  },
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

// Extract metadata from HTML meta tags
function extractMetaData(html) {
  const metaData = {
    maxResThumbnail: "",
    lengthText: "",
    durationSeconds: 0,
    genre: "",
    description: "",
  };

  try {
    // Look for length in meta tags (PT32M21S format)
    const lengthMatch = html.match(
      /<meta itemprop="duration" content="PT(\d+H)?(\d+M)?(\d+S)?"/
    );
    if (lengthMatch) {
      const hours = lengthMatch[1]
        ? parseInt(lengthMatch[1].replace("H", ""))
        : 0;
      const minutes = lengthMatch[2]
        ? parseInt(lengthMatch[2].replace("M", ""))
        : 0;
      const seconds = lengthMatch[3]
        ? parseInt(lengthMatch[3].replace("S", ""))
        : 0;

      metaData.durationSeconds = hours * 3600 + minutes * 60 + seconds;

      if (hours > 0) {
        metaData.lengthText = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      } else {
        metaData.lengthText = `${minutes}:${seconds.toString().padStart(2, "0")}`;
      }
    }

    // Look for keywords from og:video:tag meta tags
    const keywordMatches = html.matchAll(
      /<meta\s+property="og:video:tag"\s+content="([^"]+)"/g
    );
    const extractedKeywords = [];
    for (const match of keywordMatches) {
      extractedKeywords.push(match[1]);
    }
    if (extractedKeywords.length > 0) {
      metaData.keywords = extractedKeywords;
    }

    // Look for thumbnail in meta tags
    const thumbnailMatch = html.match(
      /<meta\s+property="og:image"\s+content="([^"]+)"/
    );
    if (thumbnailMatch) {
      metaData.maxResThumbnail = thumbnailMatch[1];
    }

    // Look for description in meta tags
    const descriptionMatch = html.match(
      /<meta\s+name="description"\s+content="([^"]+)"/
    );
    if (descriptionMatch) {
      metaData.description = descriptionMatch[1];
    }
  } catch (error) {
    // Meta tag extraction failed, continue
  }

  return metaData;
}

// Extract YouTube data from ytInitialPlayerResponse
function extractYouTubeData(html) {
  const initialPlayerDataJson = extractJsonBlock(
    html,
    "ytInitialPlayerResponse"
  );
  const initialDataJson = extractJsonBlock(html, "ytInitialData");
  const initialData = JSON.parse(initialPlayerDataJson);
  const ytInitialData = JSON.parse(initialDataJson);

  // Validate that we have the required data
  if (!initialData?.videoDetails) {
    throw new Error("Could not find video details in response");
  }

  return {
    initialData,
    ytInitialData,
    microformat: initialData?.microformat,
    videoDetails: initialData?.videoDetails,
  };
}

// Extract video details using the scraper configuration
function extractVideoDetails(metaData, youtubeData) {
  const result = {};

  for (const [fieldName, scraper] of Object.entries(FIELD_SCRAPERS)) {
    try {
      result[fieldName] = scraper.extract(youtubeData, metaData);
      // console.log(`\n\n${fieldName}:`, result[fieldName]);
    } catch (error) {
      console.warn(`Failed to extract field ${fieldName}:`, error.message);
      result[fieldName] =
        scraper.source === "videoDetails"
          ? []
          : scraper.source === "combined"
            ? 0
            : "";
    }
  }

  return result;
}

// Main extraction flow
const metaData = extractMetaData(html);
const youtubeData = extractYouTubeData(html);
const fullVideoDetails = extractVideoDetails(metaData, youtubeData);

// Output the result
console.log("Video Details:");
console.log(JSON.stringify(fullVideoDetails, null, 2));

/*

Return format: Single video detail object

{
  "videoId": "VyR8nqD3sQ8",
  "title": "How I'd build a one-person business (if I started over in 2026)",
  "viewCount": 95846,
  "publishTime": 1767471368000,
  "uploadDate": 1767471368000,
  "category": "Education",
  "likeCount": 4585,
  "channel": {
    "id": "UCWXYDYv5STLk-zoxMP2I1Lw",
    "title": "Dan Koe",
    "url": "https://www.youtube.com/channel/UCWXYDYv5STLk-zoxMP2I1Lw",
    "canonicalBaseUrl": "/@DanKoeTalks",
    "thumbnail": "https://yt3.ggpht.com/B4XuOHeo6s6XAbi85LUXK70itVCivYf63Bw5u1gHz-HmN2-cmgbVvAM_B8j2SAzxtbeYJT4RfA=s48-c-k-c0x00ffffff-no-rj",
    "subscriberCountText": "1.23M subscribers"
  },
  "description": "The one-person business is changing.\n\nEden – The AI canvas & drive: https://eden.so/dan-yt\n\nRead my letters on similar topics here: https://letters.thedankoe.com\n\n2 Hour Content Ecosystem: https://letters.thedankoe.com/p/how-to-build-a-world-the-2-hour-content\n\nThe One-Person Business Launchpad: https://letters.thedankoe.com/p/full-course-the-one-person-business\n\nExample prompt: https://letters.thedankoe.com/p/a-prompt-to-reset-your-life-in-30\n\nIf you'd rather watch these on Spotify: https://open.spotify.com/show/3lZRG3LCFZxKkQVSsCwoyN\n\nHow I use AI better than 99% of people: https://youtu.be/xgpLjLHB5sA\n\n––– My Books –––\n\nThe Art of Focus: https://theartoffocusbook.com\n\nPurpose & Profit: https://thedankoe.com/purpose\n\n––– Socials –––\n\nTwitter: https://twitter.com/thedankoe\nInstagram: https://instagram.com/thedankoe\nYouTube: https://youtube.com/c/DanKoeTalks\nLinkedIn: https://linkedin.com/in/thedankoe\n\n––– Chapters –––\n\n0:00 Everything is changing\n1:54 I – The one-person business model is evolving\n6:58 II – Why info products are dying\n11:43 III – The future of education products\n14:19 IV – How this actually works\n21:29 V – How to build a micro SaaS (non-exhaustive)\n25:36 VI – How to actually build the software\n\n#onepersonbusiness #selfimprovement #skillacquisition",
  "durationSeconds": 1862,
  "thumbnail": "https://i.ytimg.com/vi/VyR8nqD3sQ8/maxresdefault.jpg",
  "url": "https://www.youtube.com/watch?v=VyR8nqD3sQ8"
}
*/
