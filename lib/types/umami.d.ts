type UmamiProperties = Record<string, string | number | boolean | null>

type Umami = {
  track: (eventName: string, data?: UmamiProperties) => void
  identify?: (userId: string, data?: UmamiProperties) => void
}

declare global {
  // Umami is injected globally by a script tag. It may not exist until the script loads.
  // Using `var` allows us to type-check safe guards like `typeof umami !== 'undefined'`.
  // eslint-disable-next-line no-var
  var umami: Umami | undefined

  interface Window {
    umami?: Umami
  }
}

export {}


