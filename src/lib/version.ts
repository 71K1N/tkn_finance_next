// Injected at build time by next.config.mjs (package.json version + git short hash).
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
export const GIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA ?? "unknown";

/** SemVer with build metadata, e.g. "0.2.0+e7cbedf". */
export const APP_VERSION_LABEL = GIT_SHA === "unknown" ? APP_VERSION : `${APP_VERSION}+${GIT_SHA}`;
