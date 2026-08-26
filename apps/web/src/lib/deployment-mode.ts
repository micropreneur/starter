export const SANDBOX_MODE = import.meta.env.VITE_PUBLIC_SANDBOX_MODE === 'true'

export const APP_NOTICE_VISIBLE = SANDBOX_MODE
export const APP_NOTICE_HEIGHT = '2rem'
export const APP_SHELL_HEIGHT = APP_NOTICE_VISIBLE
  ? `calc(100svh - ${APP_NOTICE_HEIGHT})`
  : '100svh'
