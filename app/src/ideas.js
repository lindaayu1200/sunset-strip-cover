// Caption idea packs. CONTRACT (do not change signatures):
//   IDEAS: array of { id, mood, title, subtitle, kicker }
//   ideaById(id) -> entry or undefined
// Each pack is a ready-made poster voice: three short uppercase lines that fit the lettering
// band at every export size. Titles stay within 20 characters, subtitles within 40, kickers
// within 22, so no scene has to be trimmed by hand.

export const IDEAS = [
  // A careful plan that goes sideways: hard consonants, short words, no promises.
  {
    id: 'heist',
    mood: 'Heist',
    title: 'MIDNIGHT TAKE',
    subtitle: 'ONE NIGHT · ONE SCORE · NO BRAKES',
    kicker: 'EVERYTHING IS PLANNED',
  },

  // Open road and salt air; the coast is the whole point of the picture.
  {
    id: 'cruise',
    mood: 'Cruise',
    title: 'OCEAN DRIVE',
    subtitle: 'TOP DOWN · SUNSET · NO DESTINATION',
    kicker: 'THE COAST IS YOURS',
  },

  // Club-close brightness for neon grades and rooftop photos.
  {
    id: 'nightlife',
    mood: 'Nightlife',
    title: 'NEON AFTER DARK',
    subtitle: 'CLUB LIGHTS NEVER GO OUT HERE',
    kicker: 'DANCE TILL SUNRISE',
  },

  // Summer turned up too loud; pairs well with gold and miami grades.
  {
    id: 'heat',
    mood: 'Heat',
    title: 'HEAT WAVE',
    subtitle: 'ONE HUNDRED DEGREES OF TROUBLE',
    kicker: 'TURN THE VOLUME UP',
  },

  // A one-way ticket out of town, packed in a hurry.
  {
    id: 'getaway',
    mood: 'Getaway',
    title: 'LAST EXIT',
    subtitle: 'PACK THE CAR · LEAVE YOUR NAME BEHIND',
    kicker: 'NO ONE FOLLOWS',
  },

  // Two sides of the same street, both certain they are right.
  {
    id: 'rivals',
    mood: 'Rivals',
    title: 'RIVAL ROWS',
    subtitle: 'TWO CREWS · ONE CITY · ONE NIGHT',
    kicker: 'LOYALTY COSTS MORE',
  },

  // Pure motion: engines, wide boulevards and no reason to slow down.
  {
    id: 'speed',
    mood: 'Speed',
    title: 'REDLINE RUSH',
    subtitle: 'ENGINE LOUD · STREETS WIDE OPEN',
    kicker: 'SHIFT INTO OVERDRIVE',
  },

  // Postcard beauty with a crooked smile underneath it.
  {
    id: 'paradise',
    mood: 'Paradise',
    title: 'PARADISE BURNING',
    subtitle: 'PALMS · POOLS · VERY BAD IDEAS',
    kicker: 'GOOD TIMES ONLY',
  },

  // For quieter covers: empty streets, distant lights, something unresolved.
  {
    id: 'ghost',
    mood: 'Ghost',
    title: 'GHOST LIGHTS',
    subtitle: 'RADIO SILENCE ON THE COAST ROAD',
    kicker: 'STAY OFF THE GRID',
  },
];

/** Look up a pack by its id for URL-driven scenes and preset buttons. */
export function ideaById(id) {
  return IDEAS.find((idea) => idea.id === id);
}
