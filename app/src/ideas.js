// Caption packs for the idea buttons: short, poster-ready copy in one place.

export const IDEAS = [
  {
    id: 'heist',
    mood: 'Heist',
    title: 'MIDNIGHT HEIST',
    subtitle: 'FIVE MINUTES, NO ALARMS, NO WITNESSES',
    kicker: 'THE VAULT IS OPEN'
  },
  {
    id: 'cruise',
    mood: 'Cruise',
    title: 'SUNSET CRUISE',
    subtitle: 'OPEN WATER, CLOSED EYES, FULL THROTTLE',
    kicker: 'NO DESTINATION'
  },
  {
    id: 'nightlife',
    mood: 'Nightlife',
    title: 'AFTER DARK',
    subtitle: 'NEON, NOISE AND A TABLE IN THE CORNER',
    kicker: 'LAST CALL, FIRST LIGHT'
  },
  {
    id: 'heat',
    mood: 'Heat',
    title: 'HEAT WAVE',
    subtitle: 'TAR ON THE ROOF, ICE IN THE GLASS',
    kicker: 'TEMPERATURE RISING'
  },
  {
    id: 'getaway',
    mood: 'Getaway',
    title: 'THE GETAWAY',
    subtitle: 'PACK LIGHT, DRIVE FAST, VANISH BY DAWN',
    kicker: 'NO FORWARDING ADDRESS'
  },
  {
    id: 'chase',
    mood: 'Chase',
    title: 'HIGH-SPEED CHASE',
    subtitle: 'HEADLIGHTS BEHIND, OPEN ROAD AHEAD',
    kicker: 'DO NOT LOOK BACK'
  },
  {
    id: 'rendezvous',
    mood: 'Rendezvous',
    title: 'RENDEZVOUS',
    subtitle: 'ONE TABLE, TWO STRANGERS, NO PLANS',
    kicker: 'MEET AT THE LAST LIGHT'
  },
  {
    id: 'riot',
    mood: 'Riot',
    title: 'NIGHT RIOT',
    subtitle: 'STREETS ON FIRE, BASS IN THE AIR',
    kicker: 'NO CURFEW TONIGHT'
  }
];

export function ideaById(id) {
  return IDEAS.find((idea) => idea.id === id);
}

export function pickIdea() {
  return IDEAS[Math.floor(Math.random() * IDEAS.length)];
}
