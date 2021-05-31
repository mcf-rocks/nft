import { useCallback, useState } from "react";
import { MintInfo } from "@solana/spl-token";

import { TokenAccount } from "./../models";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { WAD, ZERO } from "../constants";
import { TokenInfo } from "@solana/spl-token-registry";

export type KnownTokenMap = Map<string, TokenInfo>;

export const formatPriceNumber = new Intl.NumberFormat("en-US", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 8,
});

export function useLocalStorageState(key: string, defaultState?: string) {
  const [state, setState] = useState(() => {
    // NOTE: Not sure if this is ok
    const storedState = localStorage.getItem(key);
    if (storedState) {
      return JSON.parse(storedState);
    }
    return defaultState;
  });

  const setLocalStorageState = useCallback(
    (newState) => {
      const changed = state !== newState;
      if (!changed) {
        return;
      }
      setState(newState);
      if (newState === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newState));
      }
    },
    [state, key]
  );

  return [state, setLocalStorageState];
}

// shorten the checksummed version of the input address to have 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function getTokenName(
  map: KnownTokenMap,
  mint?: string | PublicKey,
  shorten = true
): string {
  const mintAddress = typeof mint === "string" ? mint : mint?.toBase58();

  if (!mintAddress) {
    return "N/A";
  }

  const knownSymbol = map.get(mintAddress)?.symbol;
  if (knownSymbol) {
    return knownSymbol;
  }

  return shorten ? `${mintAddress.substring(0, 5)}...` : mintAddress;
}

export function getTokenByName(tokenMap: KnownTokenMap, name: string) {
  let token: TokenInfo | null = null;
  for (const val of tokenMap.values()) {
    if (val.symbol === name) {
      token = val;
      break;
    }
  }
  return token;
}

export function getTokenIcon(
  map: KnownTokenMap,
  mintAddress?: string | PublicKey
): string | undefined {
  const address =
    typeof mintAddress === "string" ? mintAddress : mintAddress?.toBase58();
  if (!address) {
    return;
  }

  return map.get(address)?.logoURI;
}

export function isKnownMint(map: KnownTokenMap, mintAddress: string) {
  return !!map.get(mintAddress);
}

export const STABLE_COINS = new Set(["USDC", "wUSDC", "USDT"]);

export function chunks<T>(array: T[], size: number): T[][] {
  return Array.apply<number, T[], T[][]>(
    0,
    new Array(Math.ceil(array.length / size))
  ).map((_, index) => array.slice(index * size, (index + 1) * size));
}

export function toLamports(
  account?: TokenAccount | number,
  mint?: MintInfo
): number {
  if (!account) {
    return 0;
  }

  const amount =
    typeof account === "number" ? account : account.info.amount?.toNumber();

  const precision = Math.pow(10, mint?.decimals || 0);
  return Math.floor(amount * precision);
}

export function wadToLamports(amount?: BN): BN {
  return amount?.div(WAD) || ZERO;
}

export function fromLamports(
  account?: TokenAccount | number | BN,
  mint?: MintInfo,
  rate: number = 1.0
): number {
  if (!account) {
    return 0;
  }

  const amount = Math.floor(
    typeof account === "number"
      ? account
      : BN.isBN(account)
      ? account.toNumber()
      : account.info.amount.toNumber()
  );

  const precision = Math.pow(10, mint?.decimals || 0);
  return (amount / precision) * rate;
}

var SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];

const abbreviateNumber = (number: number, precision: number) => {
  let tier = (Math.log10(number) / 3) | 0;
  let scaled = number;
  let suffix = SI_SYMBOL[tier];
  if (tier !== 0) {
    let scale = Math.pow(10, tier * 3);
    scaled = number / scale;
  }

  return scaled.toFixed(precision) + suffix;
};

export const formatAmount = (
  val: number,
  precision: number = 6,
  abbr: boolean = true
) => (abbr ? abbreviateNumber(val, precision) : val.toFixed(precision));

export function formatTokenAmount(
  account?: TokenAccount,
  mint?: MintInfo,
  rate: number = 1.0,
  prefix = "",
  suffix = "",
  precision = 6,
  abbr = false
): string {
  if (!account) {
    return "";
  }

  return `${[prefix]}${formatAmount(
    fromLamports(account, mint, rate),
    precision,
    abbr
  )}${suffix}`;
}

export const formatUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const numberFormatter = new Intl.NumberFormat("en-US", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const isSmallNumber = (val: number) => {
  return val < 0.001 && val > 0;
};

export const formatNumber = {
  format: (val?: number, useSmall?: boolean) => {
    if (!val) {
      return "--";
    }
    if (useSmall && isSmallNumber(val)) {
      return 0.001;
    }

    return numberFormatter.format(val);
  },
};

export const feeFormatter = new Intl.NumberFormat("en-US", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 9,
});

export const formatPct = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function convert(
  account?: TokenAccount | number,
  mint?: MintInfo,
  rate: number = 1.0
): number {
  if (!account) {
    return 0;
  }

  const amount =
    typeof account === "number" ? account : account.info.amount?.toNumber();

  const precision = Math.pow(10, mint?.decimals || 0);
  let result = (amount / precision) * rate;

  return result;
}

export function generateSVG(mint="",title="",amount=1){
	let mintFontSize ="1.08vw";
	let svgText =`<svg width="290" height="500" viewBox="0 0 290 500" xmlns="http://www.w3.org/2000/svg" xmlns:xlink='http://www.w3.org/1999/xlink'>
		<defs>
		<filter id="f1">
		<feImage result="p0" xlink:href="data:image/svg+xml;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP87s2yBwAFiwIEgZBk1gAAAABJRU5ErkJggg=="/>
		<feImage result="p1" xlink:href="data:image/svg+xml;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNU3PC0HgAE5wI3JLjSVQAAAABJRU5ErkJggg=="/>
		<feImage result="p2" xlink:href="data:image/svg+xml;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mPU6t9SDwAERgHuG6JeAQAAAABJRU5ErkJggg=="/>
		<feImage result="p3" xlink:href="data:image/svg+xml;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8oPq8HgAGRgJtNYe0KQAAAABJRU5ErkJggg=="/>
		<feBlend mode="overlay" in="p0" in2="p1" />
		<feBlend mode="exclusion" in2="p2" />
		<feBlend mode="overlay" in2="p3" result="blendOut" />
		<feGaussianBlur in="blendOut" stdDeviation="42" />
		</filter> 
		<clipPath id="corners"><rect width="290" height="500" rx="42" ry="42" />
		</clipPath><path id="text-path-a" d="M40 12 H250 A28 28 0 0 1 278 40 V460 A28 28 0 0 1 250 488 H40 A28 28 0 0 1 12 460 V40 A28 28 0 0 1 40 12 z" />
		<path id="minimap" d="M234 444C234 457.949 242.21 463 253 463" />
		<filter id="top-region-blur"><feGaussianBlur in="SourceGraphic" stdDeviation="88" />
		</filter>
		<linearGradient id="grad-up" x1="1" x2="0" y1="1" y2="0">
		<stop offset="0.0" stop-color="white" stop-opacity="1" /><stop offset=".9" stop-color="white" stop-opacity="0" /></linearGradient>
		<linearGradient id="grad-down" x1="0" x2="1" y1="0" y2="1">
		<stop offset="0.0" stop-color="white" stop-opacity="1" />
		<stop offset="0.9" stop-color="white" stop-opacity="0" /></linearGradient>
		<mask id="fade-up" maskContentUnits="objectBoundingBox">
		<rect width="1" height="1" fill="url(#grad-up)" /></mask>
		<mask id="fade-down" maskContentUnits="objectBoundingBox">
		<rect width="1" height="1" fill="url(#grad-down)" /></mask>
		<mask id="none" maskContentUnits="objectBoundingBox">
		<rect width="1" height="1" fill="white" /></mask>
		<linearGradient id="grad-symbol">
		<stop offset="0.7" stop-color="white" stop-opacity="1" />
		<stop offset=".95" stop-color="white" stop-opacity="0" /></linearGradient>
		<mask id="fade-symbol" maskContentUnits="userSpaceOnUse">
		<rect width="290px" height="200px" fill="url(#grad-symbol)" /></mask>
        <style>
         .normal { font: 'Courier New';fill: white }
         .borderText{fill: white; font-family: "'Courier New' monospace"; font-size="${mintFontSize}}
        </style>
         </defs>
		<g clip-path="url(#corners)">
		<rect fill="purple" x="0px" y="0px" width="290px" height="500px" />
		<rect style="filter: url(#f1)" x="0px" y="0px" width="290px" height="500px" /> 
		<g style="filter:url(#top-region-blur); transform:scale(1.5); transform-origin:center top;">
		<rect fill="none" x="0px" y="0px" width="290px" height="500px" />
		<ellipse cx="50%" cy="0px" rx="180px" ry="120px" fill="#000" opacity="0.85" />
		</g>
		<rect x="0" y="0" width="290" height="500" rx="42" ry="42" fill="transparent" stroke="rgba(255,255,255,0.2)" />
		</g>
		<text text-rendering="optimizeSpeed">
		<textPath startOffset="-100%" class="borderText" xlink:href="#text-path-a">
		${mint}
		 ◎ 
		 <animate additive="sum" attributeName="startOffset" from="0%" to="100%" begin="0s" dur="30s" repeatCount="indefinite" />
		</textPath> <textPath startOffset="0%" class="borderText" xlink:href="#text-path-a">
		${mint}
		 ◎ 
		 <animate additive="sum" attributeName="startOffset" from="0%" to="100%" begin="0s" dur="30s" repeatCount="indefinite" /> </textPath>
		<textPath startOffset="50%" class="borderText" xlink:href="#text-path-a">
		${mint}
		 ◎ 
		 <animate additive="sum" attributeName="startOffset" from="0%" to="100%" begin="0s" dur="30s"
		 repeatCount="indefinite" /></textPath><textPath startOffset="-50%" class="borderText" xlink:href="#text-path-a">
		${mint}
		 ◎ 
		 <animate additive="sum" attributeName="startOffset" from="0%" to="100%" begin="0s" dur="30s" repeatCount="indefinite" />
		 </textPath>
		 </text>
		 <g style="transform:translate(29px, 414px)">
			 <rect width="105px" height="26px" rx="8px" ry="8px" fill="rgba(0,0,0,0.6)" />
			 <text x="12px" y="17px" class="normal"> <tspan fill="rgba(255,255,255,0.6)">${title}</tspan></text>
                 </g> 
		 <g style="transform:translate(29px, 444px)">
			  <rect width="112px" height="26px" rx="8px" ry="8px" fill="rgba(0,0,0,0.6)" />
			  <text x="12px" y="17px" class="normal"><tspan fill="rgba(255,255,255,0.6)">Amount: </tspan>${amount}</text>
		 </g>
		</svg>`
	return svgText;
}
