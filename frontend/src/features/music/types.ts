import {
  albumFormatValues,
  wishlistStatusValues,
  type components,
} from "@/api/schema";

type Schemas = components["schemas"];

export type Album = Schemas["PartialAlbum"];
export type AlbumFormat = Schemas["AlbumFormat"];
export type AlbumDetails = Schemas["AlbumDetails"];
export type CreateAlbum = Schemas["CreateAlbum"];
export type Review = Schemas["Review"];
export type WishlistAlbum = Schemas["WishlistAlbum"];
export type WishlistStatus = Schemas["WishlistStatus"];
export type AddAlbumToWishlist = Schemas["AddAlbumToWishlist"];

/** Every album format, generated from the API schema. */
export const albumFormats = albumFormatValues;

// A Record forces every status to be placed when the backend adds one.
const statusOrder: Record<WishlistStatus, number> = {
  Wanted: 0,
  Ordered: 1,
  Received: 2,
};

/** Every wishlist status, in lifecycle order. */
export const wishlistStatuses = [...wishlistStatusValues].sort(
  (a, b) => statusOrder[a] - statusOrder[b],
);
