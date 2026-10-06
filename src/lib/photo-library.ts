import { photoUses } from "./privacy";
import type { Org } from "./org";
import type { Db, Photo } from "./types";

/** A picture in the club's own library, as the admin's picker shows it. */
export interface LibraryPhoto {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  /** The group the picture belongs to, for the filter. */
  groupId: string;
  groupName: string;
  /** «Foto: …», where it is known. */
  credit?: string;
  /** Where the picture is on the site now. */
  uses: number;
  /** The person asked about is among those in it. */
  ofPerson?: boolean;
}

/**
 * The pictures that can be used again: every picture in the project, from the
 * seed and from uploads, that may be shown. Reusing one is by reference, so
 * a redaction or a withdrawal reaches every place it stands.
 *
 * Left out: a picture that is withdrawn or waiting for someone's consent; one
 * that shows a person who is «Ikke publiser» or has not agreed to photos
 * (anonymised people are fine, their redactions follow the picture); a person's
 * own portrait (it goes with them, with their consent); and one whose file is a
 * data address, which is too heavy to list (the composer's older base64 uploads).
 */
export function libraryPhotos(db: Db, org: Org, opts: { personId?: string } = {}): LibraryPhoto[] {
  const portraits = new Set(db.people.map((p) => p.portraitPhotoId).filter(Boolean));
  const people = new Map(db.people.map((p) => [p.id, p]));
  const shown = (photo: Photo) => {
    if (photo.withdrawn || photo.awaitingConsent?.length) return false;
    if (portraits.has(photo.id)) return false;
    if (photo.src.startsWith("data:")) return false;
    return photo.people.every((pp) => {
      const person = people.get(pp.personId);
      return !person || person.privacy.status === "anonymised" || (person.privacy.status === "visible" && person.privacy.photoConsent === "granted");
    });
  };
  return db.photos
    .filter(shown)
    .map((photo): LibraryPhoto => {
      const node = org.get(photo.nodeId);
      return {
        id: photo.id,
        src: photo.src,
        width: photo.width,
        height: photo.height,
        alt: photo.alt,
        groupId: photo.nodeId,
        groupName: node?.kind === "club" ? "Hele klubben" : (node?.name ?? ""),
        credit: photo.credit,
        uses: photoUses(db, org, photo.id).length,
        ofPerson: opts.personId ? photo.people.some((pp) => pp.personId === opts.personId) : undefined,
      };
    })
    .sort((a, b) => Number(!!b.ofPerson) - Number(!!a.ofPerson))
    .reverse();
}

/** Whether a picture is in the library, so an id from the browser can be trusted. */
export const inLibrary = (db: Db, org: Org, photoId: string) => libraryPhotos(db, org).some((p) => p.id === photoId);
