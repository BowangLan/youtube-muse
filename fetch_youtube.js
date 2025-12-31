import fs from "fs";

// {
//   "id": "hVQibt46TA4",
//   "title": "Work Music for True Vision | Make It Real",
//   "author": "MM",
//   "authorUrl": "https://www.youtube.com/@MMStudioX",
//   "duration": 0,
//   "thumbnailUrl": "https://i.ytimg.com/vi/hVQibt46TA4/hqdefault.jpg",
//   "addedAt": Date.now()
// }

async function fetchYouTubChanneleData(channelId) {
  if (!channelId) {
    throw new Error("Channel ID is required");
  }

  try {
    // Fetch the YouTube page
    const response = await fetch(`https://www.youtube.com/@${channelId}/videos`);
    const html = await response.text();

    // Extract ytInitialData using regex
    const regex = /ytInitialData = ([^;]+);/;
    const match = html.match(regex);

    if (!match) {
      throw new Error("ytInitialData not found in the page");
    }

    // Parse the JSON data
    const jsonData = JSON.parse(match[1]);

    const extractedData =
      jsonData.contents.twoColumnBrowseResultsRenderer.tabs[1].tabRenderer.content.richGridRenderer.contents.map(
        (item) => {
          const video = item.richItemRenderer?.content?.videoRenderer;
          if (!video) {
            return null;
          }
          return {
            id: video.videoId,
            title: video.title?.runs?.[0]?.text ?? null,
            description: video.descriptionSnippet?.runs?.[0]?.text ?? null,
            publishedTime: video.publishedTimeText?.simpleText ?? null,
            lengthText: video.lengthText?.simpleText ?? null,
            authorUrl: `https://www.youtube.com/@${channelId}`,
            viewCount:
              Number.parseInt(
                video.viewCountText?.simpleText
                  .replace(",", "")
                  .split(" ")[0] ?? "0"
              ) ?? null,
            shortViewCount: video.shortViewCountText?.simpleText ?? null,
            // url: "/watch?v=" + video.videoId,
            // thumbnails: Array.isArray(video.thumbnail?.thumbnails)
            //   ? video.thumbnail.thumbnails.map((t) => ({
            //       url: t.url,
            //       width: t.width,
            //       height: t.height,
            //     }))
            //   : [],
          };
        }
      );

    // Save to file
    fs.writeFileSync(
      "soutyt_data.json",
      JSON.stringify(extractedData, null, 2)
    );

    console.log(`Extracted ${extractedData.length} videos`);

    console.log("Successfully saved data to soutyt_data.json");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

fetchYouTubChanneleData();
