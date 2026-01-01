const channelId = "UCWXYDYv5STLk-zoxMP2I1Lw"
const url = `https://www.youtube.com/channel/${channelId}/videos?view=0&sort=dd&flow=grid`

const extractJsonBlock = (html, marker) => {
  const markerIndex = html.indexOf(marker)
  if (markerIndex === -1) {
    throw new Error(`Marker not found: ${marker}`)
  }

  const startIndex = html.indexOf("{", markerIndex)
  if (startIndex === -1) {
    throw new Error(`JSON start not found for: ${marker}`)
  }

  let depth = 0
  let inString = false
  let isEscaped = false

  for (let i = startIndex; i < html.length; i += 1) {
    const char = html[i]

    if (inString) {
      if (isEscaped) {
        isEscaped = false
      } else if (char === "\\") {
        isEscaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === "{") {
      depth += 1
    } else if (char === "}") {
      depth -= 1
      if (depth === 0) {
        return html.slice(startIndex, i + 1)
      }
    }
  }

  throw new Error(`JSON end not found for: ${marker}`)
}

const response = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; YouTubeMuse/1.0; +https://example.com)",
    "Accept-Language": "en-US,en;q=0.9",
  },
})

if (!response.ok) {
  throw new Error(`Request failed: ${response.status} ${response.statusText}`)
}

const html = await response.text()
const initialDataJson = extractJsonBlock(html, "ytInitialData")
const initialData = JSON.parse(initialDataJson)

const tabs = initialData?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? []
const videosTab = tabs.find((tab) => {
  const renderer = tab?.tabRenderer
  if (!renderer) return false
  if (renderer.title === "Videos") return true
  return renderer.endpoint?.commandMetadata?.webCommandMetadata?.url?.includes("/videos")
})

const gridItems =
  videosTab?.tabRenderer?.content?.richGridRenderer?.contents ?? []

const videos = gridItems
  .map((item) => item?.richItemRenderer?.content?.videoRenderer)
  .filter(Boolean)
  .map((video) => ({
    videoId: video.videoId,
    title: video.title?.runs?.[0]?.text ?? "",
    publishedTime: video.publishedTimeText?.simpleText ?? "",
    viewCount: video.viewCountText?.simpleText ?? "",
    url: `https://www.youtube.com/watch?v=${video.videoId}`,
  }))

console.log(JSON.stringify(videos, null, 2))
