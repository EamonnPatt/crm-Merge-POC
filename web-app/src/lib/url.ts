/** True for an http(s) link. Anything else (javascript:, data:, typos) is never rendered as a link or iframe. */
export const isWebUrl = (url: string) => /^https?:\/\/[^\s]+$/i.test(url.trim());
