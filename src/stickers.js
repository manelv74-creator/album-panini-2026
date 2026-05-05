const TEAM_PREFIXES = [
  ["ALG", "Algeria"],
  ["ARG", "Argentina"],
  ["AUS", "Australia"],
  ["AUT", "Austria"],
  ["BEL", "Belgium"],
  ["BIH", "Bosnia and Herzegovina"],
  ["BRA", "Brazil"],
  ["CAN", "Canada"],
  ["COL", "Colombia"],
  ["CRO", "Croatia"],
  ["CZE", "Czechia"],
  ["COD", "Congo DR"],
  ["ECU", "Ecuador"],
  ["EGY", "Egypt"],
  ["ENG", "England"],
  ["FRA", "France"],
  ["GER", "Germany"],
  ["GHA", "Ghana"],
  ["HAI", "Haiti"],
  ["IRN", "Iran"],
  ["ITA", "Italy"],
  ["JPN", "Japan"],
  ["KOR", "South Korea"],
  ["MEX", "Mexico"],
  ["MAR", "Morocco"],
  ["NED", "Netherlands"],
  ["NOR", "Norway"],
  ["PAN", "Panama"],
  ["PAR", "Paraguay"],
  ["POL", "Poland"],
  ["POR", "Portugal"],
  ["QAT", "Qatar"],
  ["RSA", "South Africa"],
  ["KSA", "Saudi Arabia"],
  ["SCO", "Scotland"],
  ["SEN", "Senegal"],
  ["SRB", "Serbia"],
  ["ESP", "Spain"],
  ["SWE", "Sweden"],
  ["SUI", "Switzerland"],
  ["TUN", "Tunisia"],
  ["TUR", "Turkey"],
  ["UKR", "Ukraine"],
  ["URU", "Uruguay"],
  ["USA", "USA"],
  ["UZB", "Uzbekistan"],
  ["WAL", "Wales"],
  ["NZL", "New Zealand"]
];

const KNOWN_STICKERS = {
  ARG1: "Emblem",
  ARG2: "Emiliano Martinez",
  ARG3: "Nahuel Molina",
  ARG4: "Cristian Romero",
  ARG5: "Nicolas Otamendi",
  ARG6: "Nicolas Tagliafico",
  ARG7: "Leonardo Balerdi",
  ARG8: "Enzo Fernandez",
  ARG9: "Alexis Mac Allister",
  ARG10: "Rodrigo De Paul",
  ARG11: "Exequiel Palacios",
  ARG12: "Leandro Paredes",
  ARG13: "Team Photo",
  ARG14: "Nico Paz",
  ARG15: "Franco Mastantuono",
  ARG16: "Nico Gonzalez",
  ARG17: "Lionel Messi",
  ARG18: "Lautaro Martinez",
  ARG19: "Julian Alvarez",
  ARG20: "Giuliano Simeone",
  MEX1: "Emblem",
  MEX2: "Luis Malagon",
  MEX3: "Johan Vasquez",
  MEX4: "Jorge Sanchez",
  MEX5: "Cesar Montes",
  MEX6: "Jesus Gallardo",
  MEX7: "Israel Reyes",
  MEX8: "Diego Lainez",
  MEX9: "Carlos Rodriguez",
  MEX10: "Edson Alvarez",
  MEX11: "Orbelin Pineda",
  MEX12: "Marcel Ruiz",
  MEX13: "Team Photo",
  MEX14: "Erick Sanchez",
  MEX15: "Hirving Lozano",
  MEX16: "Santiago Gimenez",
  MEX17: "Raul Jimenez",
  MEX18: "Alexis Vega",
  MEX19: "Roberto Alvarado",
  MEX20: "Cesar Huerta",
  FWC1: "Official Emblem 1/2",
  FWC2: "Official Emblem 2/2",
  FWC3: "Official Mascots",
  FWC4: "Official Slogan",
  FWC5: "Official Ball",
  FWC6: "Canada Host Country Emblem",
  FWC7: "Mexico Host Country Emblem",
  FWC8: "USA Host Country Emblem",
  FWC9: "FIFA World Cup Sweden 1958",
  FWC10: "FIFA World Cup Chile 1962",
  FWC11: "FIFA World Cup England 1966",
  FWC12: "FIFA World Cup Argentina 1978",
  FWC13: "FIFA World Cup Spain 1982",
  FWC14: "FIFA World Cup Mexico 1986",
  FWC15: "FIFA World Cup USA 1994",
  FWC16: "FIFA World Cup Korea/Japan 2002",
  FWC17: "FIFA World Cup Germany 2006",
  FWC18: "FIFA World Cup Brazil 2014",
  FWC19: "FIFA World Cup Qatar 2022"
};

const SPECIAL_STICKERS = [
  { code: "FWC00", name: "Official Tournament Poster", team: "FIFA World Cup 2026" },
  { code: "FWC1", name: KNOWN_STICKERS.FWC1, team: "FIFA World Cup 2026" },
  { code: "FWC2", name: KNOWN_STICKERS.FWC2, team: "FIFA World Cup 2026" },
  { code: "FWC3", name: KNOWN_STICKERS.FWC3, team: "FIFA World Cup 2026" },
  { code: "FWC4", name: KNOWN_STICKERS.FWC4, team: "FIFA World Cup 2026" },
  { code: "FWC5", name: KNOWN_STICKERS.FWC5, team: "FIFA World Cup 2026" },
  { code: "FWC6", name: KNOWN_STICKERS.FWC6, team: "Host Countries and Cities" },
  { code: "FWC7", name: KNOWN_STICKERS.FWC7, team: "Host Countries and Cities" },
  { code: "FWC8", name: KNOWN_STICKERS.FWC8, team: "Host Countries and Cities" },
  ...Array.from({ length: 11 }, (_, index) => {
    const number = index + 9;
    const code = `FWC${number}`;

    return {
      code,
      name: KNOWN_STICKERS[code],
      team: "FIFA World Cup History"
    };
  })
];

export const STICKERS = [
  ...SPECIAL_STICKERS,
  ...TEAM_PREFIXES.flatMap(([prefix, team]) =>
    Array.from({ length: 20 }, (_, index) => {
      const number = index + 1;
      const code = `${prefix}${number}`;

      return {
        code,
        name: KNOWN_STICKERS[code] || (number === 1 ? "Emblem" : number === 13 ? "Team Photo" : `Sticker ${number}`),
        team
      };
    })
  )
];

export function normalizeStickerCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function findSticker(value) {
  const normalized = normalizeStickerCode(value);
  return STICKERS.find((sticker) => normalizeStickerCode(sticker.code) === normalized);
}
