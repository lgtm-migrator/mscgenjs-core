import * as domprimitives from "./domprimitives";
import * as geotypes from "./geotypes";
import getDiagonalAngle from "./getdiagonalangle";
import round from "./round";

const PRECISION = 2;

export function point2String(pPoint: geotypes.IPoint): string {
  return `${round(pPoint.x, PRECISION).toString()},${round(
    pPoint.y,
    PRECISION
  ).toString()} `;
}

export function pathPoint2String(pType: string, pX, pY): string {
  return pType + point2String({ x: pX, y: pY });
}

function createMarker(
  pId: string,
  pClass: string,
  pOrient: string,
  pViewBox?: string
): SVGMarkerElement {
  /* so, why not start at refX=0, refY=0? It would simplify reasoning
   * about marker paths significantly...
   *
   * TL;DR: canvg doesn't seem to handle this very well.
   * - Don't know yet why.
   * - Suspicion: with (0,0) the marker paths we use would end up having
   *   negative coordinates (e.g. "M 0 0 L -8 2" for a left to right
   *   signal)
   */
  return domprimitives.createElement("marker", {
    orient: pOrient,
    id: pId,
    class: pClass,
    viewBox: Boolean(pViewBox) ? pViewBox : "0 0 10 10",
    refX: "9",
    refY: "3",
    markerUnits: "strokeWidth",
    markerWidth: "10",
    markerHeight: "10",
  }) as SVGMarkerElement;
  /* for scaling to the lineWidth of the line the marker is attached to,
   * userSpaceOnUse looks like a good plan, but it is not only the
   * paths that don't scale, it's also the linewidth (which makes sense).
   * We'll have to roll our own path transformation algorithm if we want
   * to change only the linewidth and not the rest
   */
}

function createLink(pURL: string, pElementToWrap: SVGElement): SVGAElement {
  const lA = domprimitives.createElement("a");
  domprimitives.setAttributesNS(lA, domprimitives.XLINKNS, {
    "xlink:href": pURL,
    "xlink:title": pURL,
  });
  lA.appendChild(pElementToWrap);
  return lA as SVGAElement;
}

/* superscript style could also be super or a number (1em) or a % (100%) */
let lSuperscriptStyle = "vertical-align:text-top;";
lSuperscriptStyle += "font-size:0.7em;text-anchor:start;";

export function createTSpan(
  pLabel: string,
  pURL?: string
): SVGTSpanElement | SVGAElement {
  const lTSpanLabel = domprimitives.createElement("tspan");
  const lContent = domprimitives.createTextNode(pLabel);
  lTSpanLabel.appendChild(lContent);
  if (pURL) {
    return createLink(pURL, lTSpanLabel);
  } else {
    return lTSpanLabel as SVGTSpanElement;
  }
}

interface ICreateTextOptions {
  class?: string;
  url?: string;
  id?: string;
  idurl?: string;
}
export function createText(
  pLabel: string,
  pCoords: geotypes.IPoint,
  pOptions?: ICreateTextOptions
): SVGTextElement {
  const lOptions: ICreateTextOptions = Object.assign(
    {
      class: null,
      url: null,
      id: null,
      idurl: null,
    },
    pOptions
  );
  const lText = domprimitives.createElement("text", {
    x: round(pCoords.x, PRECISION).toString(),
    y: round(pCoords.y, PRECISION).toString(),
    class: lOptions.class,
  });

  lText.appendChild(createTSpan(pLabel, lOptions.url));

  if (lOptions.id) {
    const lTSpanID = createTSpan(` [${lOptions.id}]`, lOptions.idurl);
    lTSpanID.setAttribute("style", lSuperscriptStyle);
    lText.appendChild(lTSpanID);
  }
  return lText as SVGTextElement;
}

interface ICreatePathOptions {
  class?: string;
  style?: string;
  color?: string;
  bgColor?: string;
}
/**
 * Creates an svg path element given the path pD, with pClass applied
 * (if provided)
 *
 * @param {string} pD - the path
 * @param {string} pOptions - an object with (optional) keys class, style, color and bgColor
 * @return {SVGElement}
 */
export function createPath(
  pD: string,
  pOptions: ICreatePathOptions
): SVGPathElement {
  const lOptions: ICreatePathOptions = Object.assign(
    {
      class: null,
      style: null,
      color: null,
      bgColor: null,
    },
    pOptions
  );
  return colorBox(
    domprimitives.createElement("path", {
      d: pD,
      class: lOptions.class,
      style: lOptions.style,
    }),
    lOptions.color,
    lOptions.bgColor
  ) as SVGPathElement;
}

function colorBox(
  pElement: SVGElement,
  pColor?: string,
  pBgColor?: string
): SVGElement {
  let lStyleString = "";
  if (pBgColor) {
    lStyleString += `fill:${pBgColor};`;
  }
  if (pColor) {
    lStyleString += `stroke:${pColor};`;
  }
  return domprimitives.setAttribute(
    pElement,
    "style",
    lStyleString
  ) as SVGElement;
}

interface ICreateSinlgeLineOptions {
  class?: string;
}
export function createSingleLine(
  pLine: geotypes.ILine,
  pOptions: ICreateSinlgeLineOptions
): SVGLineElement {
  return domprimitives.createElement("line", {
    x1: round(pLine.xFrom, PRECISION).toString(),
    y1: round(pLine.yFrom, PRECISION).toString(),
    x2: round(pLine.xTo, PRECISION).toString(),
    y2: round(pLine.yTo, PRECISION).toString(),
    class: pOptions ? pOptions.class : null,
  }) as SVGLineElement;
}

interface ICreateRectOptions {
  class?: string;
  color?: string;
  bgColor?: string;
  rx?: number;
  ry?: number;
}
/**
 * Creates an svg rectangle of width x height, with the top left
 * corner at coordinates (x, y). pRX and pRY define the amount of
 * rounding the corners of the rectangle get; when they're left out
 * the function will render the corners as straight.
 *
 * Unit: pixels
 *
 * @param {object} pBBox
 * @param {string} pClass - reference to the css class to be applied
 * @param {number=} pRX
 * @param {number=} pRY
 * @return {SVGElement}
 */
export function createRect(
  pBBox: geotypes.IBBox,
  pOptions: ICreateRectOptions
): SVGRectElement {
  const lOptions: ICreateRectOptions = Object.assign(
    {
      class: null,
      color: null,
      bgColor: null,
      rx: null,
      ry: null,
    },
    pOptions
  );
  return colorBox(
    domprimitives.createElement("rect", {
      width: round(pBBox.width, PRECISION),
      height: round(pBBox.height, PRECISION),
      x: round(pBBox.x, PRECISION),
      y: round(pBBox.y, PRECISION),
      rx: round(lOptions.rx || 0, PRECISION),
      ry: round(lOptions.ry || 0, PRECISION),
      class: lOptions.class,
    }),
    lOptions.color,
    lOptions.bgColor
  ) as SVGRectElement;
}

interface ICreateUTurnOptions {
  class?: string;
  dontHitHome?: boolean;
  lineWidth?: number;
}
/**
 * Creates a u-turn, departing on pPoint.x, pPoint.y and
 * ending on pPoint.x, pEndY with a width of pWidth
 *
 * @param {object} pBBox
 * @param {number} pEndY
 * @param {number} pWidth
 * @param {string} pOptions - reference to the css class to be applied
 * @return {SVGElement}
 */
export function createUTurn(
  pBBox: geotypes.IBBox,
  pEndY: number,
  pOptions: ICreateUTurnOptions
): SVGPathElement {
  const lOptions: ICreateUTurnOptions = Object.assign(
    {
      class: null,
      dontHitHome: false,
      lineWidth: 1,
    },
    pOptions
  );
  const lEndX = lOptions.dontHitHome
    ? pBBox.x + 7.5 * (lOptions.lineWidth || 1)
    : pBBox.x;

  return createPath(
    // point to start from:
    pathPoint2String("M", pBBox.x, pBBox.y - pBBox.height / 2) +
      // curve first to:
      pathPoint2String(
        "C",
        pBBox.x + pBBox.width,
        pBBox.y - (7.5 * (lOptions.lineWidth || 1)) / 2
      ) +
      // curve back from.:
      point2String({ x: pBBox.x + pBBox.width, y: pEndY + 0 }) +
      // curve end-pont:
      point2String({ x: lEndX, y: pEndY }),
    { class: lOptions.class }
  );
}

/**
 * Creates an svg group, identifiable with id pId
 * @param {string} pId
 * @return {SVGElement}
 */
export function createGroup(pId?: string, pClass?: string): SVGGElement {
  return domprimitives.createElement("g", {
    id: pId,
    class: pClass,
  }) as SVGGElement;
}

/**
 * Create an arrow marker consisting of a path as specified in pD
 *
 * @param {string} pId
 * @param {string} pD - a string containing the path
 */
export function createMarkerPath(
  pId: string,
  pD: string,
  pColor: string
): SVGMarkerElement {
  const lMarker = createMarker(pId, "arrow-marker", "auto");
  /* stroke-dasharray: 'none' should work to override any dashes (like in
   * return messages (a >> b;)) and making sure the marker end gets
   * lines
   * This, however, does not work in webkit, hence the curious
   * value for the stroke-dasharray
   */
  lMarker.appendChild(
    createPath(pD, {
      class: "arrow-style",
      style: `stroke-dasharray:100,1;stroke:${pColor}` || "black",
    })
  );
  return lMarker;
}

/**
 * Create a (filled) arrow marker consisting of a polygon as specified in pPoints
 *
 * @param {string} pId
 * @param {string} pPoints - a string with the points of the polygon
 * @return {SVGElement}
 */
export function createMarkerPolygon(
  pId: string,
  pPoints: string,
  pColor: string
): SVGMarkerElement {
  const lMarker = createMarker(pId, "arrow-marker", "auto");
  lMarker.appendChild(
    domprimitives.createElement("polygon", {
      points: pPoints,
      class: "arrow-style",
      stroke: pColor || "black",
      fill: pColor || "black",
    }) as SVGPolygonElement
  );
  return lMarker;
}
export function createTitle(pText: string): SVGTitleElement {
  const lTitle = domprimitives.createElement("title");
  const lText = domprimitives.createTextNode(pText);
  lTitle.appendChild(lText);
  return lTitle;
}

/**
 * Creates a text node with the given pText fitting diagonally (bottom-left
 *  - top right) in canvas pCanvas
 *
 * @param {string} pText
 * @param {object} pDimension (an object with at least a .width and a .height)
 */
export function createDiagonalText(
  pText: string,
  pDimension: geotypes.IDimension,
  pClass: string
): SVGElement {
  return domprimitives.setAttributes(
    createText(
      pText,
      { x: pDimension.width / 2, y: pDimension.height / 2 },
      { class: pClass }
    ),
    {
      transform:
        `rotate(${round(getDiagonalAngle(pDimension), PRECISION).toString()} ` +
        `${round(pDimension.width / 2, PRECISION).toString()} ` +
        `${round(pDimension.height / 2, PRECISION).toString()})`,
    }
  ) as SVGElement;
}

/**
 * Creates a desc element with id pId
 *
 * @param {string} pID
 * @returns {Element}
 */
export function createDesc(): SVGDescElement {
  return domprimitives.createElement("desc");
}

/**
 * Creates an empty 'defs' element
 *
 * @returns {Element}
 */
export function createDefs(): SVGDefsElement {
  return domprimitives.createElement("defs") as SVGDefsElement;
}

/**
 * Creates a basic SVG with id pId, and size 0x0
 * @param {string} pId
 * @return {Element} an SVG element
 */
export function createSVG(pId: string, pClass: string): SVGSVGElement {
  return domprimitives.createElement("svg", {
    version: "1.1",
    id: pId,
    class: pClass,
    xmlns: domprimitives.SVGNS,
    "xmlns:xlink": domprimitives.XLINKNS,
    width: "0",
    height: "0",
  }) as SVGSVGElement;
}

export const init = domprimitives.init;
export const updateSVG = domprimitives.setAttributes;

/*
 This file is part of mscgen_js.

 mscgen_js is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 mscgen_js is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with mscgen_js.  If not, see <http://www.gnu.org/licenses/>.
 */
