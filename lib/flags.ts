// Maps team display names to ISO flag codes. Flag SVGs live in /public/flags/<code>.svg
// (public-domain national flags from the MIT-licensed flag-icons set).
// Teams not in the map (e.g. demo sides) render a fallback in <Flag/>.

const TEAM_TO_CODE: Record<string, string> = {
  Algeria: "dz",
  Argentina: "ar",
  Australia: "au",
  Austria: "at",
  Belgium: "be",
  "Bosnia and Herzegovina": "ba",
  Brazil: "br",
  Canada: "ca",
  "Cape Verde": "cv",
  Colombia: "co",
  "Congo DR": "cd",
  Croatia: "hr",
  Curacao: "cw",
  Czechia: "cz",
  Ecuador: "ec",
  Egypt: "eg",
  England: "gb-eng",
  France: "fr",
  Germany: "de",
  Ghana: "gh",
  Haiti: "ht",
  Iran: "ir",
  Iraq: "iq",
  "Ivory Coast": "ci",
  Japan: "jp",
  Jordan: "jo",
  Mexico: "mx",
  Morocco: "ma",
  Netherlands: "nl",
  "New Zealand": "nz",
  Norway: "no",
  Panama: "pa",
  Paraguay: "py",
  Portugal: "pt",
  Qatar: "qa",
  "Saudi Arabia": "sa",
  Scotland: "gb-sct",
  Senegal: "sn",
  "South Africa": "za",
  "South Korea": "kr",
  Spain: "es",
  Sweden: "se",
  Switzerland: "ch",
  Tunisia: "tn",
  Turkey: "tr",
  "United States": "us",
  Uruguay: "uy",
  Uzbekistan: "uz",
};

/** ISO flag code for a team name, or null if unknown (e.g. demo sides). */
export function flagCode(team: string): string | null {
  return TEAM_TO_CODE[team.trim()] ?? null;
}

/** Public path to a team's flag SVG, or null. */
export function flagSrc(team: string): string | null {
  const code = flagCode(team);
  return code ? `/flags/${code}.svg` : null;
}
