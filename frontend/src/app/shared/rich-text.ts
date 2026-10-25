import type { ColorSwatch } from '@anotoki/lib/ui/color-field';

/**
 * The class names genshin's texts may carry beside the anotoki family's allow-list (@anotoki/lib/ui/rich-html,
 * anotoki-lib 0.11.0): "tag", the guides' badge, drawn by shared/local-lib/rich-text.scss. Named wherever a text is
 * shown (`<anotoki-rich-html [classes]>`: a guide, a voice line) or edited (`<anotoki-html-editor [classes]>`); the
 * server keeps the same list as it saves one (backend api/rich_text.php).
 */
export const RICH_TEXT_CLASSES: readonly string[] = ['tag'];

/** The fonts the admin panel's HTML editor offers (`<anotoki-html-editor [fonts]>`): the three it always had. */
export const EDITOR_FONTS: readonly string[] = ['Arial', 'Times New Roman', 'Courier New'];

/** The colours suggested under the editor's colour field, each with its name (never a colour alone): the palette it always offered. */
export const EDITOR_SWATCHES: readonly ColorSwatch[] = [
  { value: '#f44336', name: 'Red' },
  { value: '#e91e63', name: 'Pink' },
  { value: '#9c27b0', name: 'Purple' },
  { value: '#673ab7', name: 'Deep purple' },
  { value: '#3f51b5', name: 'Indigo' },
  { value: '#2196f3', name: 'Blue' },
  { value: '#03a9f4', name: 'Light blue' },
  { value: '#00bcd4', name: 'Cyan' },
  { value: '#009688', name: 'Teal' },
  { value: '#4caf50', name: 'Green' },
  { value: '#8bc34a', name: 'Light green' },
  { value: '#cddc39', name: 'Lime' },
  { value: '#ffeb3b', name: 'Yellow' },
  { value: '#ffc107', name: 'Amber' },
  { value: '#ff9800', name: 'Orange' },
  { value: '#ff5722', name: 'Deep orange' },
  { value: '#795548', name: 'Brown' },
  { value: '#9e9e9e', name: 'Grey' },
  { value: '#607d8b', name: 'Blue grey' },
  { value: '#000000', name: 'Black' },
  { value: '#ffffff', name: 'White' },
];
