/** One azulejo tile as SVG: cobalt on white, corner rosettes + a four-petal flower. Tiles seamlessly. */
export const AZUL = "#1d4ba0";
export const AZUL_SOFT = "#b9cdee";
export const TILE_BG = "#fbf9f4";

export const TILE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
<rect width="100" height="100" fill="${TILE_BG}"/>
<g fill="none" stroke="${AZUL}" stroke-width="1.6">
<circle cx="0" cy="0" r="24"/><circle cx="100" cy="0" r="24"/><circle cx="0" cy="100" r="24"/><circle cx="100" cy="100" r="24"/>
<circle cx="0" cy="0" r="15"/><circle cx="100" cy="0" r="15"/><circle cx="0" cy="100" r="15"/><circle cx="100" cy="100" r="15"/>
</g>
<g fill="${AZUL}"><circle cx="0" cy="0" r="6"/><circle cx="100" cy="0" r="6"/><circle cx="0" cy="100" r="6"/><circle cx="100" cy="100" r="6"/></g>
<g fill="${AZUL_SOFT}" stroke="${AZUL}" stroke-width="1.6">
<ellipse cx="50" cy="31" rx="9" ry="17"/><ellipse cx="50" cy="69" rx="9" ry="17"/>
<ellipse cx="31" cy="50" rx="17" ry="9"/><ellipse cx="69" cy="50" rx="17" ry="9"/>
</g>
<circle cx="50" cy="50" r="6" fill="${AZUL}"/>
<rect x="4" y="4" width="92" height="92" fill="none" stroke="${AZUL}" stroke-width=".7" opacity=".35"/>
</svg>`;

export const tileDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(TILE_SVG)}`;
