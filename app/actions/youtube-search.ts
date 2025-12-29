"use server";

import YoutubeSearchApi from "youtube-search-api";

export type SearchResult = {
  id: string;
  title: string;
  thumbnail: {
    thumbnails: Array<{ url: string; width: number; height: number }>;
  };
  channelTitle: string;
  length?: {
    simpleText: string;
  };
};

export async function searchYouTubeVideos(
  query: string,
  type: "video" | "channel" | "playlist" | "movie" = "video"
): Promise<{ results: SearchResult[]; error?: string }> {
  try {
    if (!query.trim()) {
      return { results: [] };
    }

    const result = await YoutubeSearchApi.GetListByKeyword(query, false, 10, [{ type }]);
    // Filter for videos only and exclude YouTube Shorts
    const videos = result.items.filter((item: any) => {
      // Only include regular videos, exclude shorts
      if (item.type !== "video") return false;
      // Exclude items marked as shorts
      if (item.isShort === true) return false;
      return true;
    });

    const formattedResults: SearchResult[] = videos.map((item: any) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnail,
      channelTitle: item.channelTitle,
      length: item.length,
    }));

    return { results: formattedResults };
  } catch (error) {
    console.error("YouTube search error:", error);
    return {
      results: [],
      error: "Failed to search videos. Please try again.",
    };
  }
}
