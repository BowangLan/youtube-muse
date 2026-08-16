export type CatalogSearchSource = "youtube" | "spotify";

export interface CatalogSearchImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface CatalogSearchAuthor {
  id: string | null;
  name: string;
  url: string | null;
  images: CatalogSearchImage[];
  raw: unknown;
}

/**
 * Provider-neutral fields shared by every catalog search result.
 *
 * `raw` intentionally retains the complete provider response object. Structured
 * common fields make routine UI and playback code provider-independent without
 * sacrificing data that a future feature may need.
 */
export interface CatalogSearchResultBase<
  TSource extends CatalogSearchSource,
  TResultType extends string,
  TRaw,
> {
  source: TSource;
  resultType: TResultType;
  id: string;
  title: string;
  url: string;
  authors: CatalogSearchAuthor[];
  images: CatalogSearchImage[];
  raw: TRaw;
}

export function catalogAuthorNames(authors: CatalogSearchAuthor[]) {
  return authors.map((author) => author.name).join(", ");
}

export function catalogPrimaryImage(images: CatalogSearchImage[]) {
  return images.find((image) => (image.width ?? 0) >= 300)?.url ?? images[0]?.url ?? null;
}
