"use server";

/**
 * YouTube Video Detail Unofficial API - Server Action
 *
 * Fetches detailed information for a single YouTube video given its URL.
 * Uses web scraping instead of official YouTube Data API.
 *
 * Usage:
 *   const result = await getYouTubeVideoDetailUnofficial("https://www.youtube.com/watch?v=VIDEO_ID");
 */

// HTTP Headers
const HTTP_HEADERS = {
  USER_AGENT: "Mozilla/5.0 (compatible; YouTubeMuse/1.0; +https://example.com)",
  ACCEPT_LANGUAGE: "en-US,en;q=0.9",
} as const;

// Error Messages
const ERROR_MESSAGES = {
  INVALID_URL: "Invalid YouTube URL format",
  REQUEST_FAILED: "Request failed:",
  VIDEO_DETAILS_NOT_FOUND: "Could not find video details in response",
  EXTRACTION_FAILED: "Failed to extract video details",
} as const;

// JSON Markers
const JSON_MARKERS = {
  YT_INITIAL_PLAYER_RESPONSE: "ytInitialPlayerResponse",
  YT_INITIAL_DATA: "ytInitialData",
} as const;

// Types for the unofficial YouTube video detail API response structures
interface YouTubeVideoDetailChannel {
  id: string;
  title: string;
  url: string;
  canonicalBaseUrl?: string;
  thumbnail?: string;
  subscriberCountText?: string;
}

interface YouTubeVideoChapter {
  title: string;
  startTimeSeconds: number;
  thumbnail: string;
}

export interface YouTubeVideoDetailResult {
  videoId: string;
  title: string;
  viewCount: number;
  publishTime: number; // timestamp in milliseconds
  uploadDate: number; // timestamp in milliseconds
  category: string;
  likeCount: number;
  channel: YouTubeVideoDetailChannel;
  description: string;
  durationSeconds: number;
  thumbnail: string;
  url: string;
  chapters: YouTubeVideoChapter[];
  keywords?: string[];
}

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url: string): string {
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

  throw new Error(ERROR_MESSAGES.INVALID_URL);
}

/**
 * Extract JSON block from HTML using marker
 */
function extractJsonBlock(html: string, marker: string): string {
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
}

// Traverse object to find channel thumbnail
function findChannelThumbnail(obj: any, path: string[] = []): string | null {
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
function findSubscriberCount(obj: any, path: string[] = []): string | null {
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
function findChannelCanonicalBaseUrl(obj: any, path: string[] = []): string | null {
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

// Traverse object to find chapters
function findChapters(obj: any, path: string[] = []): any[] | null {
  if (!obj || typeof obj !== "object") return null;

  // Check if this object has a chapters property
  if (obj.chapters) {
    return obj.chapters;
  }

  // Recursively search nested objects
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const result = findChapters(obj[key], [...path, key]);
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
    extract: (data: any) => data.videoId || "",
  },
  title: {
    source: "videoDetails",
    extract: (data: any) => data.videoDetails?.title ?? "",
  },
  viewCount: {
    source: "videoDetails",
    extract: (data: any) => {
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
    extract: (data: any) => {
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
    extract: (data: any) => {
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
    extract: (data: any) =>
      data.microformat?.playerMicroformatRenderer?.category ?? "",
  },
  // Like count from microformat
  likeCount: {
    source: "microformat",
    extract: (data: any) => {
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
    extract: (data: any) => {
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
    extract: (data: any) => data.videoDetails?.shortDescription ?? "",
  },
  // Duration from videoDetails
  durationSeconds: {
    source: "videoDetails",
    extract: (data: any) => parseInt(data.videoDetails?.lengthSeconds ?? 0),
  },
  // Thumbnail from videoDetails
  thumbnail: {
    source: "videoDetails",
    extract: (data: any) => {
      const thumbnails = data.videoDetails?.thumbnail?.thumbnails ?? [];
      if (thumbnails.length > 0) {
        // Sort by resolution and get the highest
        thumbnails.sort((a: any, b: any) => b.width * b.height - a.width * a.height);
        return thumbnails[0].url;
      }
      return "";
    },
  },
  // Static URL field
  url: {
    source: "static",
    extract: (data: any) => data.url || "",
  },

  // Chapters from ytInitialData
  chapters: {
    source: "combined",
    extract: (data: any) => {
      if (data.ytInitialData) {
        const rawChapters = findChapters(data.ytInitialData) || [];
        return rawChapters.map((ch: any) => ({
          title: ch.chapterRenderer.title.simpleText,
          startTimeSeconds: ch.chapterRenderer.timeRangeStartMillis,
          thumbnail: ch.chapterRenderer.thumbnail.thumbnails[0].url,
        }));
      }
      return [];
    },
  },
};

/**
 * Extract metadata from HTML meta tags
 */
function extractMetaData(html: string) {
  const metaData: {
    maxResThumbnail: string;
    lengthText: string;
    durationSeconds: number;
    genre: string;
    description: string;
    keywords?: string[];
  } = {
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
    const extractedKeywords: string[] = [];
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

/**
 * Extract YouTube data from ytInitialPlayerResponse and ytInitialData
 */
function extractYouTubeData(html: string, videoId: string, url: string) {
  const initialPlayerDataJson = extractJsonBlock(
    html,
    JSON_MARKERS.YT_INITIAL_PLAYER_RESPONSE
  );
  const initialDataJson = extractJsonBlock(html, JSON_MARKERS.YT_INITIAL_DATA);
  const initialData = JSON.parse(initialPlayerDataJson);
  const ytInitialData = JSON.parse(initialDataJson);

  // Validate that we have the required data
  if (!initialData?.videoDetails) {
    throw new Error(ERROR_MESSAGES.VIDEO_DETAILS_NOT_FOUND);
  }

  return {
    initialData,
    ytInitialData,
    microformat: initialData?.microformat,
    videoDetails: initialData?.videoDetails,
    videoId,
    url,
  };
}

/**
 * Extract video details using the scraper configuration
 */
function extractVideoDetails(metaData: any, youtubeData: any): YouTubeVideoDetailResult {
  const result: any = {};

  for (const [fieldName, scraper] of Object.entries(FIELD_SCRAPERS)) {
    try {
      result[fieldName] = scraper.extract(youtubeData);
    } catch (error) {
      console.warn(`Failed to extract field ${fieldName}:`, error instanceof Error ? error.message : String(error));
      result[fieldName] =
        scraper.source === "videoDetails"
          ? []
          : scraper.source === "combined"
            ? {}
            : "";
    }
  }

  // Add keywords from meta data if available
  if (metaData.keywords) {
    result.keywords = metaData.keywords;
  }

  return result as YouTubeVideoDetailResult;
}

/**
 * Get detailed information for a YouTube video using unofficial scraping API
 */
export async function getYouTubeVideoDetailUnofficial(
  youtubeUrl: string
): Promise<{ result?: YouTubeVideoDetailResult; error?: string }> {
  try {
    if (!youtubeUrl.trim()) {
      return { error: "YouTube URL is required" };
    }

    // Extract video ID from YouTube URL
    let videoId: string;
    try {
      videoId = extractVideoId(youtubeUrl);
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;

    // Initial request
    const response = await fetch(url, {
      headers: {
        "User-Agent": HTTP_HEADERS.USER_AGENT,
        "Accept-Language": HTTP_HEADERS.ACCEPT_LANGUAGE,
      },
    });

    if (!response.ok) {
      throw new Error(`${ERROR_MESSAGES.REQUEST_FAILED} ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Extract metadata from HTML meta tags
    const metaData = extractMetaData(html);

    // Extract YouTube data from ytInitialPlayerResponse
    const youtubeData = extractYouTubeData(html, videoId, url);

    // Extract video details using the scraper configuration
    const fullVideoDetails = extractVideoDetails(metaData, youtubeData);

    return { result: fullVideoDetails };
  } catch (error) {
    console.error("YouTube video detail extraction error:", error);
    return {
      error: ERROR_MESSAGES.EXTRACTION_FAILED,
    };
  }
}
