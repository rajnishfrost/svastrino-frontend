/* Inline SVG icons for the video player (no emoji, no icon-font dependency).
   All use `currentColor`, so they take the button's colour, and are sized by CSS. */
const base = {
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  xmlns: 'http://www.w3.org/2000/svg',
  focusable: 'false',
  'aria-hidden': true,
}

export const IconPlay = (p) => (
  <svg {...base} {...p}><path d="M8 5v14l11-7z" /></svg>
)

export const IconPause = (p) => (
  <svg {...base} {...p}><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
)

export const IconVolHigh = (p) => (
  <svg {...base} {...p}>
    <path d="M3 10v4h4l5 4V6L7 10H3z" />
    <path d="M16.5 12a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12z" />
    <path d="M14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z" />
  </svg>
)

export const IconVolLow = (p) => (
  <svg {...base} {...p}>
    <path d="M3 10v4h4l5 4V6L7 10H3z" />
    <path d="M16.5 12a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12z" />
  </svg>
)

export const IconVolMute = (p) => (
  <svg {...base} {...p}>
    <path d="M3 10v4h4l5 4V6L7 10H3z" />
    <path d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
)

export const IconGear = (p) => (
  <svg {...base} {...p}>
    <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.31-.07.63-.07.94s.02.63.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.38.3.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.25.41.48.41h3.84c.23 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
  </svg>
)

export const IconFullscreen = (p) => (
  <svg {...base} {...p}><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
)

export const IconExitFullscreen = (p) => (
  <svg {...base} {...p}><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
)

export const IconLock = (p) => (
  <svg {...base} {...p}>
    <path d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-9h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM8.9 6a3.1 3.1 0 0 1 6.2 0v2H8.9V6z" />
  </svg>
)

export const IconDownload = (p) => (
  <svg {...base} {...p}><path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 2h14v2H5v-2z" /></svg>
)
