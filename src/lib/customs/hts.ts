import { logServerError } from "@/lib/security/public-errors";

const USITC_HTS_SEARCH_URL = "https://hts.usitc.gov/reststop/search";
const MAX_HTS_RESULTS = 12;
const MAX_EXPANDED_QUERIES = 4;

const materialTokens = new Set(["aluminium", "aluminum", "metal", "plastic", "plastics", "rubber", "stainless", "steel"]);

const queryExpansions: Record<string, string[]> = {
  aluminium: ["7616", "7604", "aluminum articles"],
  aluminum: ["7616", "7604", "aluminum articles"],
  assembly: ["8479", "machinery parts"],
  assemblage: ["8479", "machinery parts"],
  bar: ["7214", "bars rods profiles"],
  bearing: ["8482", "ball roller bearings"],
  bearings: ["8482", "ball roller bearings"],
  bolt: ["7318", "screws bolts nuts"],
  bolts: ["7318", "screws bolts nuts"],
  boite: ["4819", "boxes cases cartons"],
  box: ["4819", "boxes cases cartons"],
  bracket: ["8302", "mountings fittings brackets"],
  brackets: ["8302", "mountings fittings brackets"],
  cable: ["8544", "insulated wire cable"],
  cables: ["8544", "insulated wire cable"],
  capteur: ["9026", "measuring checking instruments"],
  carton: ["4819", "cartons boxes cases"],
  case: ["4202", "cases containers"],
  casting: ["7325", "cast articles iron steel"],
  castings: ["7325", "cast articles iron steel"],
  chaine: ["7315", "transmission chain"],
  chain: ["7315", "transmission chain"],
  connector: ["8536", "electrical connectors"],
  connectors: ["8536", "electrical connectors"],
  courroie: ["4010", "transmission belts"],
  crate: ["4415", "packing cases crates"],
  crates: ["4415", "packing cases crates"],
  drum: ["7310", "casks drums cans"],
  fitting: ["7307", "pipe fittings"],
  fittings: ["7307", "pipe fittings"],
  gasket: ["8484", "gaskets seals"],
  gaskets: ["8484", "gaskets seals"],
  gear: ["8483", "gears gearing"],
  gears: ["8483", "gears gearing"],
  idler: ["8483", "pulleys pulley blocks"],
  machined: ["8479", "machinery parts"],
  metal: ["7326", "articles of iron or steel"],
  motor: ["8501", "electric motors"],
  motors: ["8501", "electric motors"],
  nut: ["7318", "screws bolts nuts washers"],
  nuts: ["7318", "screws bolts nuts washers"],
  palette: ["4415", "pallets box pallets"],
  pallet: ["4415", "pallets box pallets"],
  pallets: ["4415", "pallets box pallets"],
  panel: ["8537", "boards panels consoles"],
  piece: ["8479", "machinery parts"],
  pieces: ["8479", "machinery parts"],
  plate: ["7210", "plates sheets strip"],
  plastic: ["3926", "articles of plastics"],
  plastics: ["3926", "articles of plastics"],
  pulley: ["8483", "pulleys pulley blocks"],
  pulleys: ["8483", "pulleys pulley blocks"],
  pump: ["8413", "pumps for liquids"],
  pumps: ["8413", "pumps for liquids"],
  roue: ["8708", "wheels parts accessories"],
  rubber: ["4016", "articles of rubber"],
  seal: ["8484", "gaskets seals"],
  seals: ["8484", "gaskets seals"],
  sensor: ["9026", "measuring checking instruments"],
  sensors: ["9026", "measuring checking instruments"],
  shaft: ["8483", "transmission shafts"],
  shafts: ["8483", "transmission shafts"],
  sheet: ["7210", "sheets plates strip"],
  screw: ["7318", "screws bolts nuts"],
  screws: ["7318", "screws bolts nuts"],
  spacer: ["7318", "screws bolts nuts washers"],
  spacers: ["7318", "screws bolts nuts washers"],
  spring: ["7320", "springs leaves"],
  springs: ["7320", "springs leaves"],
  stainless: ["7326", "stainless steel articles"],
  steel: ["7326", "articles of iron or steel"],
  support: ["8302", "mountings fittings brackets"],
  supports: ["8302", "mountings fittings brackets"],
  valve: ["8481", "taps cocks valves"],
  valves: ["8481", "taps cocks valves"],
  washer: ["7318", "screws bolts nuts washers"],
  washers: ["7318", "screws bolts nuts washers"],
  weldment: ["7326", "articles of iron or steel"],
  wheel: ["8708", "wheels parts accessories"],
  wheels: ["8708", "wheels parts accessories"],
  wire: ["8544", "insulated wire cable"],
};

type UsitcHtsEntry = {
  description?: string | null;
  general?: string | null;
  htsno?: string | null;
  other?: string | null;
  special?: string | null;
  units?: string[] | null;
};

export type HtsSearchResult = {
  description: string;
  generalRate: string | null;
  htsno: string;
  otherRate: string | null;
  specialRate: string | null;
  units: string[];
};

function normalizeCode(value: string) {
  return value.replace(/\D/g, "");
}

function cleanDescription(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEntry(entry: UsitcHtsEntry): HtsSearchResult | null {
  const htsno = entry.htsno?.trim();
  const description = cleanDescription(entry.description);

  if (!htsno || !description) {
    return null;
  }

  return {
    description,
    generalRate: entry.general?.trim() || null,
    htsno,
    otherRate: entry.other?.trim() || null,
    specialRate: entry.special?.trim() || null,
    units: Array.isArray(entry.units) ? entry.units.filter(Boolean) : [],
  };
}

function tokenizeQuery(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

function buildExpandedQueries(query: string) {
  const normalizedQuery = query.trim();
  const compactCode = normalizedQuery.replace(/\D/g, "");

  if (compactCode.length >= 4) {
    return Array.from(new Set([normalizedQuery, compactCode])).slice(0, MAX_EXPANDED_QUERIES);
  }

  const queries = new Set<string>();
  const tokens = tokenizeQuery(normalizedQuery);

  for (const token of tokens.filter((value) => !materialTokens.has(value))) {
    for (const expansion of queryExpansions[token] ?? []) {
      queries.add(expansion);
    }
  }

  for (const token of tokens.filter((value) => materialTokens.has(value))) {
    for (const expansion of queryExpansions[token] ?? []) {
      queries.add(expansion);
    }
  }

  queries.add(normalizedQuery);

  return Array.from(queries).slice(0, MAX_EXPANDED_QUERIES);
}

export async function searchHtsEntries(query: string) {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2 || trimmedQuery.length > 80) {
    return [];
  }

  const expandedQueries = buildExpandedQueries(trimmedQuery);
  const results = new Map<string, HtsSearchResult>();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    for (const searchQuery of expandedQueries) {
      if (results.size >= MAX_HTS_RESULTS) {
        break;
      }

      const url = `${USITC_HTS_SEARCH_URL}?keyword=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url, {
        cache: "no-store",
        headers: { accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`USITC HTS search failed with status ${response.status}`);
      }

      const data = (await response.json()) as UsitcHtsEntry[];

      data
        .map(normalizeEntry)
        .filter((entry): entry is HtsSearchResult => Boolean(entry))
        .forEach((entry) => {
          if (results.size < MAX_HTS_RESULTS) {
            results.set(`${entry.htsno}-${entry.description}`, entry);
          }
        });
    }

    return Array.from(results.values());
  } catch (error) {
    logServerError({ action: "search_hts_entries", error });
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function findHtsEntryByCode(htsCode: string) {
  const normalizedTarget = normalizeCode(htsCode);
  const results = await searchHtsEntries(htsCode);

  return results.find((result) => normalizeCode(result.htsno) === normalizedTarget) ?? null;
}
