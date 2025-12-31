import { create } from "zustand"
import type { PlayerCommand, PlayerEvent, PlayerState } from "@/lib/player-core/types"
import { assertPlayerInvariants } from "@/lib/player-core/invariants"
import { createPlayerState, reducePlayerState } from "@/lib/player-core/reduce"

type CommandRunner = (commands: PlayerCommand[]) => void

let commandRunner: CommandRunner = () => {}

export const setPlayerCommandRunner = (runner: CommandRunner) => {
  commandRunner = runner
}

interface PlayerStore extends PlayerState {
  dispatch: (event: PlayerEvent) => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  ...createPlayerState(),
  dispatch: (event) => {
    const result = reducePlayerState(get(), event)

    if (process.env.NODE_ENV !== "production") {
      assertPlayerInvariants(result.state)
    }

    set(result.state)
    commandRunner(result.commands)
  },
}))
