export type View = "home" | "seances" | "classes" | "classe" | "assiduite" | "justifs"
export type Tone = "neutral" | "warn" | "ok"

export type TagData = { text: string; tone: Tone }
export type Period = { label: string; short: string }

export type ViewProps = { go: (view: View) => void }
