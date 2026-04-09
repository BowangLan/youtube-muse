"use server"

// URL Constants
const YOUTUBE_URLS = {
  BASE: "https://www.youtube.com",
  CHANNEL_PATH: "/channel/",
  VIDEOS_PATH: "/videos",
  VIDEOS_TAB_TITLE: "Videos",
} as const

// HTTP Headers
const HTTP_HEADERS = {
  USER_AGENT: "Mozilla/5.0 (compatible; YouTubeMuse/1.0; +https://example.com)",
  ACCEPT_LANGUAGE: "en-US,en;q=0.9",
} as const

// JSON Parsing
const JSON_MARKERS = {
  YT_INITIAL_DATA: "ytInitialData",
} as const

// Error Messages
const ERROR_MESSAGES = {
  REQUEST_FAILED: "Request failed:",
  NO_VIDEOS_FOUND: "No videos found for this channel",
  FETCH_LATEST_VIDEO_FAILED: "Failed to fetch latest video",
} as const

// Types for unofficial YouTube API response structures
interface YouTubeTabRenderer {
  tabRenderer?: {
    title?: string;
    endpoint?: {
      commandMetadata?: {
        webCommandMetadata?: {
          url?: string;
        };
      };
    };
    content?: {
      richGridRenderer?: {
        contents?: Array<{
          richItemRenderer?: {
            content?: {
              videoRenderer?: YouTubeUnofficialVideoRenderer;
            };
          };
        }>;
      };
    };
  };
}

interface YouTubeInitialData {
  contents?: {
    twoColumnBrowseResultsRenderer?: {
      tabs?: YouTubeTabRenderer[];
    };
  };
}

// Types for unofficial YouTube API video renderer
export type YouTubeUnofficialVideoRenderer = {
  videoId: string
  thumbnail: {
    thumbnails: Array<{
      url: string
      width: number
      height: number
    }>
  }
  title: {
    runs: Array<{
      text: string
    }>
    accessibility: {
      accessibilityData: {
        label: string
      }
    }
  }
  descriptionSnippet: {
    runs: Array<{
      text: string
    }>
  }
  publishedTimeText: {
    simpleText: string
  }
  lengthText: {
    accessibility: {
      accessibilityData: {
        label: string
      }
    }
    simpleText: string
  }
  viewCountText: {
    simpleText: string
  }
  navigationEndpoint: {
    clickTrackingParams: string
    commandMetadata: {
      webCommandMetadata: {
        url: string
        webPageType: string
        rootVe: number
      }
    }
    watchEndpoint: {
      videoId: string
      watchEndpointSupportedOnesieConfig: {
        html5PlaybackOnesieConfig: {
          commonConfig: {
            url: string
          }
        }
      }
    }
  }
  ownerBadges?: Array<{
    metadataBadgeRenderer: {
      icon: {
        iconType: string
      }
      style: string
      tooltip: string
      trackingParams: string
      accessibilityData: {
        label: string
      }
    }
  }>
  trackingParams: string
  showActionMenu: boolean
  shortViewCountText: {
    accessibility: {
      accessibilityData: {
        label: string
      }
    }
    simpleText: string
  }
  menu: {
    menuRenderer: {
      items: Array<{
        menuServiceItemRenderer?: {
          text: {
            runs: Array<{
              text: string
            }>
          }
          icon: {
            iconType: string
          }
          serviceEndpoint: {
            clickTrackingParams: string
            commandMetadata: {
              webCommandMetadata: {
                sendPost: boolean
                apiUrl?: string
              }
            }
            signalServiceEndpoint?: {
              signal: string
              actions: Array<{
                clickTrackingParams: string
                addToPlaylistCommand: {
                  openMiniplayer: boolean
                  videoId: string
                  listType: string
                  onCreateListCommand: {
                    clickTrackingParams: string
                    commandMetadata: {
                      webCommandMetadata: {
                        sendPost: boolean
                        apiUrl: string
                      }
                    }
                    createPlaylistServiceEndpoint: {
                      videoIds: string[]
                      params: string
                    }
                  }
                  videoIds: string[]
                  videoCommand?: {
                    clickTrackingParams: string
                    commandMetadata: {
                      webCommandMetadata: {
                        url: string
                        webPageType: string
                        rootVe: number
                      }
                    }
                    watchEndpoint: {
                      videoId: string
                      playerParams: string
                      watchEndpointSupportedOnesieConfig: {
                        html5PlaybackOnesieConfig: {
                          commonConfig: {
                            url: string
                          }
                        }
                      }
                    }
                  }
                }
              }>
            }
            shareEntityServiceEndpoint?: {
              serializedShareEntity: string
              commands: Array<{
                clickTrackingParams: string
                openPopupAction: {
                  popup: {
                    unifiedSharePanelRenderer: {
                      trackingParams: string
                      showLoadingSpinner: boolean
                    }
                  }
                  popupType: string
                  beReused: boolean
                }
              }>
            }
          }
          trackingParams: string
        }
        menuNavigationItemRenderer?: {
          text: {
            runs: Array<{
              text: string
            }>
          }
          icon: {
            iconType: string
          }
          navigationEndpoint: {
            clickTrackingParams: string
            commandMetadata: {
              webCommandMetadata: {
                url: string
                webPageType: string
                rootVe: number
              }
            }
            signInEndpoint: {
              nextEndpoint: {
                clickTrackingParams: string
                showSheetCommand: {
                  panelLoadingStrategy: {
                    requestTemplate: {
                      panelId: string
                      params: string
                    }
                  }
                }
              }
            }
          }
          trackingParams: string
        }
      }>
      trackingParams: string
      accessibility: {
        accessibilityData: {
          label: string
        }
      }
    }
  }
  thumbnailOverlays: Array<{
    thumbnailOverlayTimeStatusRenderer?: {
      text: {
        accessibility: {
          accessibilityData: {
            label: string
          }
        }
        simpleText: string
      }
      style: string
    }
    thumbnailOverlayToggleButtonRenderer?: {
      isToggled?: boolean
      untoggledIcon: {
        iconType: string
      }
      toggledIcon?: {
        iconType: string
      }
      untoggledTooltip: string
      toggledTooltip?: string
      untoggledServiceEndpoint: {
        clickTrackingParams: string
        commandMetadata: {
          webCommandMetadata: {
            sendPost: boolean
            apiUrl?: string
          }
        }
        playlistEditEndpoint?: {
          playlistId: string
          actions: Array<{
            addedVideoId?: string
            action: string
            removedVideoId?: string
          }>
        }
        signalServiceEndpoint?: {
          signal: string
          actions: Array<{
            clickTrackingParams: string
            addToPlaylistCommand: {
              openMiniplayer: boolean
              videoId: string
              listType: string
              onCreateListCommand: {
                clickTrackingParams: string
                commandMetadata: {
                  webCommandMetadata: {
                    sendPost: boolean
                    apiUrl: string
                  }
                }
                createPlaylistServiceEndpoint: {
                  videoIds: string[]
                  params: string
                }
              }
              videoIds: string[]
            }
          }>
        }
      }
      toggledServiceEndpoint?: {
        clickTrackingParams: string
        commandMetadata: {
          webCommandMetadata: {
            sendPost: boolean
            apiUrl: string
          }
        }
        playlistEditEndpoint: {
          playlistId: string
          actions: Array<{
            action: string
            removedVideoId: string
          }>
        }
      }
      untoggledAccessibility: {
        accessibilityData: {
          label: string
        }
      }
      toggledAccessibility?: {
        accessibilityData: {
          label: string
        }
      }
      trackingParams: string
    }
    thumbnailOverlayNowPlayingRenderer?: {
      text: {
        runs: Array<{
          text: string
        }>
      }
    }
  }>
}

/**
 * Fetch latest video ID from a YouTube channel using unofficial YouTube API
 */
export async function getChannelLatestVideoIdUnofficial(
  channelId: string
): Promise<{ videos: YouTubeUnofficialVideoRenderer[]; error?: string }> {
  try {
    const url = channelId.startsWith("@")
      ? `${YOUTUBE_URLS.BASE}/${channelId}${YOUTUBE_URLS.VIDEOS_PATH}`
      : `${YOUTUBE_URLS.BASE}/${YOUTUBE_URLS.CHANNEL_PATH}${channelId}${YOUTUBE_URLS.VIDEOS_PATH}`;

    console.log(`[getChannelLatestVideoIdUnofficial] Fetching URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": HTTP_HEADERS.USER_AGENT,
        "Accept-Language": HTTP_HEADERS.ACCEPT_LANGUAGE,
      },
    });

    console.log(`[getChannelLatestVideoIdUnofficial] Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      return {
        videos: [],
        error: `${ERROR_MESSAGES.REQUEST_FAILED} ${response.status} ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Extract ytInitialData JSON block
    const extractJsonBlock = (html: string, marker: string): string => {
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

    const initialDataJson = extractJsonBlock(html, JSON_MARKERS.YT_INITIAL_DATA);
    const initialData: YouTubeInitialData = JSON.parse(initialDataJson);

    const tabs = initialData?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
    const videosTab = tabs.find((tab: YouTubeTabRenderer) => {
      const renderer = tab?.tabRenderer;
      if (!renderer) return false;
      if (renderer.title === YOUTUBE_URLS.VIDEOS_TAB_TITLE) return true;
      return renderer.endpoint?.commandMetadata?.webCommandMetadata?.url?.includes(YOUTUBE_URLS.VIDEOS_PATH);
    });

    const gridItems =
      videosTab?.tabRenderer?.content?.richGridRenderer?.contents ?? [];

    const videos = gridItems
      .map((item) => item?.richItemRenderer?.content?.videoRenderer)
      .filter((video): video is YouTubeUnofficialVideoRenderer => Boolean(video?.videoId));

    if (videos.length > 0) {
      return { videos };
    }

    return {
      videos: [],
      error: ERROR_MESSAGES.NO_VIDEOS_FOUND,
    };
  } catch (error) {
    console.error("Get channel latest video unofficial error:", error);
    return {
      videos: [],
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.FETCH_LATEST_VIDEO_FAILED,
    };
  }
}
