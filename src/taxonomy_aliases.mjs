// Shared taxonomy name adjustments used by both the dashboard UI and build scripts.

// When a row has a "base" species name but the Audubon list uses a specific form,
// map to the preferred Audubon entry for ordering purposes.
export const AUDUBON_PREFERRED_NAME_BY_CANON = new Map([
  ['yellow-rumped warbler', "Yellow-rumped Warbler (Audubon's)"],
  ['northern flicker', 'Northern Flicker (Red-shafted)'],
  ['snow goose', 'Snow Goose (white form)'],
]);

// Aliases where eBird-style taxa should follow an Audubon umbrella entry.
// Keys are normalized species keys (lowercase, trimmed).
export const AUDUBON_ALIAS_BY_KEY = new Map([
  ['zonotrichia sp.', 'sparrow sp.'],
  ['larus sp.', 'gull sp.'],
  ['accipitrine hawk sp.', 'Accipiter sp.'],
  // Iceland Gull is treated as Thayer's Gull in this Audubon list.
  ['iceland gull', "Thayer's Gull"],
  // Put the slash Accipiter pair with the Accipiter umbrella entry.
  ["sharp-shinned/cooper's hawk", 'Accipiter sp.'],
]);
