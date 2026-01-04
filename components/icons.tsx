import {
  IoPlay,
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoPause,
  IoChevronUp,
  IoShuffle,
  IoRepeat,
  IoPlayForwardSharp,
  IoPlayBackSharp,
  IoVolumeHigh,
  IoVolumeMute,
  IoVolumeOff,
} from "react-icons/io5";

export const Icons = {
  Play: IoPlay,
  SkipBack: IoPlaySkipBack,
  SkipForward: IoPlaySkipForward,
  Pause: IoPause,
  ChevronUp: IoChevronUp,
  Shuffle: IoShuffle,
  SeekForward: IoPlayForwardSharp,
  SeekBack: IoPlayBackSharp,
  Volume: IoVolumeHigh,
  Mute: IoVolumeMute,
} as const;
