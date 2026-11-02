// Injected at build time by next.config.mjs (package.json version + git commit count).
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
export const BUILD_NUMBER = process.env.NEXT_PUBLIC_BUILD_NUMBER ?? "unknown";

/** Version with the commit count as 4th segment, e.g. "0.2.0.2345". */
export const APP_VERSION_LABEL = BUILD_NUMBER === "unknown" ? APP_VERSION : `${APP_VERSION}.${BUILD_NUMBER}`;
