/**
 * The largest an uploaded picture may be: 300 kB, for every picture that goes on the site (a news post's main picture and
 * the ones in the text, a group's or a venue's photo, a portrait, a profile picture). The browser squeezes a picture to this
 * before it is sent (components/admin/prepare-image.ts, which also drops the file's metadata); the server checks it again for
 * a request that did not come from the browser (actions.ts). Screenshots sent with feedback are not site pictures and have
 * their own limit.
 */
export const MAX_UPLOAD_BYTES = 300_000;
