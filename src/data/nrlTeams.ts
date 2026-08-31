/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NRLTeam } from '../types';

export const NRL_TEAMS: NRLTeam[] = [
  {
    id: 'BRONCOS',
    name: 'Brisbane Broncos',
    shortName: 'Broncos',
    code: 'BRI',
    primaryColor: '#67002B', // Maroon
    secondaryColor: '#FFC72C', // Gold
    venue: 'Suncorp Stadium, Brisbane',
    city: 'Brisbane',
  },
  {
    id: 'PANTHERS',
    name: 'Penrith Panthers',
    shortName: 'Panthers',
    code: 'PEN',
    primaryColor: '#000000', // Black
    secondaryColor: '#00A3E0', // Teal/Panther
    venue: 'BlueBet Stadium, Penrith',
    city: 'Sydney',
  },
  {
    id: 'ROOSTERS',
    name: 'Sydney Roosters',
    shortName: 'Roosters',
    code: 'SYD',
    primaryColor: '#002B49', // Tricolour Navy
    secondaryColor: '#E03C31', // Red
    venue: 'Allianz Stadium, Sydney',
    city: 'Sydney',
  },
  {
    id: 'STORM',
    name: 'Melbourne Storm',
    shortName: 'Storm',
    code: 'MEL',
    primaryColor: '#4A154B', // Purple
    secondaryColor: '#FFC72C', // Gold
    venue: 'AAMI Park, Melbourne',
    city: 'Melbourne',
  },
  {
    id: 'RABBITOHS',
    name: 'South Sydney Rabbitohs',
    shortName: 'Rabbitohs',
    code: 'SOU',
    primaryColor: '#005335', // Cardinal & Myrtle Green
    secondaryColor: '#C41230', // Red
    venue: 'Accor Stadium, Sydney',
    city: 'Sydney',
  },
  {
    id: 'EELS',
    name: 'Parramatta Eels',
    shortName: 'Eels',
    code: 'PAR',
    primaryColor: '#0055A5', // Blue
    secondaryColor: '#FFC72C', // Gold
    venue: 'CommBank Stadium, Parramatta',
    city: 'Sydney',
  },
  {
    id: 'SEA_EAGLES',
    name: 'Manly Warringah Sea Eagles',
    shortName: 'Sea Eagles',
    code: 'MAN',
    primaryColor: '#6B0F2B', // Maroon
    secondaryColor: '#FFFFFF', // White
    venue: '4 Pines Park, Brookvale',
    city: 'Sydney',
  },
  {
    id: 'SHARKS',
    name: 'Cronulla-Sutherland Sharks',
    shortName: 'Sharks',
    code: 'CRO',
    primaryColor: '#00A3E0', // Sky Blue
    secondaryColor: '#000000', // Black
    venue: 'PointsBet Stadium, Cronulla',
    city: 'Sydney',
  },
  {
    id: 'COWBOYS',
    name: 'North Queensland Cowboys',
    shortName: 'Cowboys',
    code: 'NQL',
    primaryColor: '#002B49', // Navy
    secondaryColor: '#FFC72C', // Yellow
    venue: 'Queensland Country Bank Stadium, Townsville',
    city: 'Townsville',
  },
  {
    id: 'RAIDERS',
    name: 'Canberra Raiders',
    shortName: 'Raiders',
    code: 'CAN',
    primaryColor: '#78BE20', // Lime Green
    secondaryColor: '#002B49', // Navy
    venue: 'GIO Stadium, Canberra',
    city: 'Canberra',
  },
  {
    id: 'KNIGHTS',
    name: 'Newcastle Knights',
    shortName: 'Knights',
    code: 'NEW',
    primaryColor: '#0055A5', // Blue
    secondaryColor: '#C41230', // Red
    venue: 'McDonald Jones Stadium, Newcastle',
    city: 'Newcastle',
  },
  {
    id: 'DRAGONS',
    name: 'St. George Illawarra Dragons',
    shortName: 'Dragons',
    code: 'STI',
    primaryColor: '#C41230', // Red
    secondaryColor: '#FFFFFF', // White
    venue: 'Netstrata Jubilee Stadium, Kogarah',
    city: 'Sydney',
  },
  {
    id: 'WARRIORS',
    name: 'New Zealand Warriors',
    shortName: 'Warriors',
    code: 'WAR',
    primaryColor: '#002B49', // Blue/Black
    secondaryColor: '#20B2AA', // Teal
    venue: 'Go Media Stadium, Auckland',
    city: 'Auckland',
  },
  {
    id: 'TITANS',
    name: 'Gold Coast Titans',
    shortName: 'Titans',
    code: 'GLD',
    primaryColor: '#00A3E0', // Cyan Blue
    secondaryColor: '#FFC72C', // Gold
    venue: 'Cbus Super Stadium, Gold Coast',
    city: 'Gold Coast',
  },
  {
    id: 'TIGERS',
    name: 'Wests Tigers',
    shortName: 'Tigers',
    code: 'WST',
    primaryColor: '#FF6600', // Orange
    secondaryColor: '#000000', // Black
    venue: 'Leichhardt Oval, Sydney',
    city: 'Sydney',
  },
  {
    id: 'DOLPHINS',
    name: 'Dolphins',
    shortName: 'Dolphins',
    code: 'DOL',
    primaryColor: '#C41230', // Red
    secondaryColor: '#FFC72C', // Gold
    venue: 'Kayo Stadium, Redcliffe',
    city: 'Brisbane',
  },
  {
    id: 'BULLDOGS',
    name: 'Canterbury-Bankstown Bulldogs',
    shortName: 'Bulldogs',
    code: 'BUL',
    primaryColor: '#0055A5', // Blue
    secondaryColor: '#FFFFFF', // White
    venue: 'Belmore Sports Ground, Sydney',
    city: 'Sydney',
  },
];

export function getTeamById(id: string): NRLTeam | undefined {
  if (!id) return undefined;
  const uppercase = id.toUpperCase().trim();
  const normalized = uppercase.replace(/-/g, '_');
  if (normalized === 'WESTS_TIGERS' || normalized === 'WEST_TIGERS' || normalized === 'WST' || normalized === 'TIGER') {
    return NRL_TEAMS.find((t) => t.id === 'TIGERS');
  }
  return NRL_TEAMS.find((t) => t.id === normalized || t.id === uppercase || t.id === id);
}
