const channelId = "@LofiZenSpot";
const url = `https://youtube.com/${channelId}`;

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

// First, let's see what's available in the data structure
const channelMetadataRenderer = initialData?.metadata?.channelMetadataRenderer;

const channelHeaderRenderer =
  initialData?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel;

const channelInfo = {
  // Basic metadata
  channelId: channelMetadataRenderer?.externalId ?? "",
  title: channelMetadataRenderer?.title ?? "",
  description: channelMetadataRenderer?.description ?? "",
  keywords: channelMetadataRenderer?.keywords ?? "",
  avatar: channelMetadataRenderer?.avatar?.thumbnails?.[0]?.url ?? "",
  banner: channelHeaderRenderer?.banner?.image?.sources?.[0]?.url ?? "",
  canonicalUrl: channelMetadataRenderer?.canonicalUrl ?? "",
  country: channelMetadataRenderer?.country ?? "",

  // Header info (subscriber count, etc.)
  subscriberCount: channelHeaderRenderer?.metadata?.content ?? "",
  videoCount: "", // Not available on main channel page
  joinedDate: "", // Not available on main channel page
  viewCount: "", // Not available on main channel page
  location: "", // Not available on main channel page
  links: [], // Not available on main channel page
};

// Debug subscriber count extraction
if (channelHeaderRenderer?.metadata) {
  console.log(
    "Metadata structure:",
    JSON.stringify(channelHeaderRenderer.metadata, null, 2)
  );
}

console.log(JSON.stringify(channelInfo, null, 2));
