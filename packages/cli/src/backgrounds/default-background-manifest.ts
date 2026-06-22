export interface DefaultBackgroundAsset {
  fileName: string;
  url: string;
  bytes: number;
  sha256: string;
  contentType: string;
}

export interface DefaultBackgroundManifest {
  version: 1;
  source: string;
  assets: readonly DefaultBackgroundAsset[];
}

export const DEFAULT_BACKGROUND_MANIFEST: DefaultBackgroundManifest = {
  "version": 1,
  "source": "Cloudflare R2 bucket zuey/decor-cli/default-backgrounds",
  "assets": [
    {
      "fileName": "forest-light-pexels.jpeg",
      "url": "https://pub-66925d6199b64be496dd68f8324a964a.r2.dev/decor-cli/default-backgrounds/forest-light-pexels.jpeg",
      "bytes": 1712550,
      "sha256": "2afe208d9867645fc990bfb167387408edd60c4075d90b102109825095b15683",
      "contentType": "image/jpeg"
    },
    {
      "fileName": "golden-autumn-meadow.jpg",
      "url": "https://pub-66925d6199b64be496dd68f8324a964a.r2.dev/decor-cli/default-backgrounds/golden-autumn-meadow.jpg",
      "bytes": 2648961,
      "sha256": "77fc6197da760fcaf67b7b4b7681d865fe4b7235d94ffac086bf48899635232e",
      "contentType": "image/jpeg"
    },
    {
      "fileName": "green-mountain-landscape.jpg",
      "url": "https://pub-66925d6199b64be496dd68f8324a964a.r2.dev/decor-cli/default-backgrounds/green-mountain-landscape.jpg",
      "bytes": 347819,
      "sha256": "af00463a5436a89d8189d15c0aba6d1ca9bcde87095c442f178ec859cb3e2187",
      "contentType": "image/jpeg"
    },
    {
      "fileName": "minimal-sawmill-forest.jpg",
      "url": "https://pub-66925d6199b64be496dd68f8324a964a.r2.dev/decor-cli/default-backgrounds/minimal-sawmill-forest.jpg",
      "bytes": 309234,
      "sha256": "fd0965491b67be792917f4d05ef9bc51cec36771745353ae6c8db10654ab7a72",
      "contentType": "image/jpeg"
    },
    {
      "fileName": "natural-light-forest-landscape.jpg",
      "url": "https://pub-66925d6199b64be496dd68f8324a964a.r2.dev/decor-cli/default-backgrounds/natural-light-forest-landscape.jpg",
      "bytes": 1230700,
      "sha256": "97116a09bb2059823b0b907b5260f7e7d3f615002615adf1acd18cd642a1fb9d",
      "contentType": "image/jpeg"
    },
    {
      "fileName": "red-distortion-preview.webp",
      "url": "https://pub-66925d6199b64be496dd68f8324a964a.r2.dev/decor-cli/default-backgrounds/red-distortion-preview.webp",
      "bytes": 18944,
      "sha256": "da1b43c28db08527e13c47ce4baf88d062cf4c06d51a1728999aecfd692622fb",
      "contentType": "image/webp"
    },
    {
      "fileName": "spiral-gradient-wallpaper.jpg",
      "url": "https://pub-66925d6199b64be496dd68f8324a964a.r2.dev/decor-cli/default-backgrounds/spiral-gradient-wallpaper.jpg",
      "bytes": 1088108,
      "sha256": "f47ab4a1a51f8b62effc98e5913fc6635dd8a3336c488c5924d787139346b964",
      "contentType": "image/jpeg"
    }
  ]
};
