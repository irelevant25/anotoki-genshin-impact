/**
 * How assets are named.
 *
 * A file's name is never typed by hand: it is derived from the entity that owns
 * it, so the asset tree stays consistent and renaming an entity is enough to
 * rename what its next upload lands as. The rules here mirror the server side
 * in `php/api/routes/genshin_impact/endpoints/uploads.php`, which sanitises
 * whatever it is given before writing it.
 *
 * Two styles are in use, both already followed by the stored data:
 *
 *   snake    upper case, punctuation dropped, spaces to underscores
 *            "Hu Tao" -> HU_TAO,  "Shimenawa's Reminiscence" -> SHIMENAWAS_REMINISCENCE
 *            used by characters, enemies, artifacts, weapons and foods
 *
 *   literal  the display name as typed, minus what a filesystem rejects
 *            "Narukami's Affection" -> Narukami's Affection
 *            used by materials, banners and backgrounds, whose art the site
 *            resolves by display name
 */

/** Upper snake case, the naming most of the asset tree uses. */
export function toAssetBaseName(name: string | null | undefined): string {
  return String(name ?? '')
    .replace(/[^A-Za-z0-9\s]/g, '')
    .replace(/\s/g, '_')
    .toUpperCase()
    .replace(/^_+|_+$/g, '');
}

/**
 * The display name kept as typed, with only what a path cannot hold removed.
 * Apostrophes stay; colons and quotes go, which is what the stored files do:
 * "Maintenance Mek: Gold Leader" is filed as "Maintenance Mek Gold Leader.avif".
 */
export function toAssetLiteralName(name: string | null | undefined): string {
  return String(name ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/*?:"<>|\x00-\x1F]/g, '')
    .replace(/ {2,}/g, ' ')
    .trim();
}

/**
 * A variant of the same picture, e.g. a character's second card icon.
 * Appended directly: HU_TAO -> HU_TAO2.
 */
export function assetVariant(base: string, variant: string): string {
  return base ? `${base}${variant}` : '';
}

/**
 * A different rendering of the same thing, e.g. a food's suspicious version.
 * Appended as a separate word: MOONDROP -> MOONDROP - suspicious.
 */
export function assetSuffix(base: string, suffix: string): string {
  return base ? `${base} - ${suffix}` : '';
}
