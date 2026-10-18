// Personnages, pouvoirs, coups et poses
export const W = 960;            // largeur de l'arène en unités de jeu (1 unité = 1 cm)
export const GRAV = .85;

// stats : hp, vitesse, dégâts, portée, saut
export const CHARS = [
  { id: 'moi', name: 'Hacéne', kind: 'human', build: 'normal', hair: 'short', top: 'jacket', bottom: 'jeans', shoe: '#3a2c22', scale: 1, color: '#2e2d2b', color2: '#3b4150', skin: '#b48a70', hairCol: '#1e1712',
    power: 'dragon', proj: 'energy', projName: "Boule d'énergie", stats: { hp: 100, spd: 1, dmg: 1, reach: 1, jump: 1 }, tag: 'Équilibré' },
  { id: 'frere', name: 'Anis', kind: 'human', build: 'big', hair: 'buzz', top: 'hoodie', bottom: 'jogging', shoe: '#2a2a2c', scale: 1.04, color: '#4f5338', color2: '#2c2c2e', skin: '#a87e64', hairCol: '#16110d',
    power: 'taureau', proj: 'ballon', projName: 'Tir de ballon', stats: { hp: 112, spd: .9, dmg: 1.12, reach: 1.05, jump: .94 }, tag: 'Costaud' },
  { id: 'petit', name: 'Manil', kind: 'human', build: 'kid', hair: 'kid', top: 'tshirt', bottom: 'shorts', shoe: '#8a8478', scale: .72, color: '#8a7a58', color2: '#3a3f4a', skin: '#c19478', hairCol: '#22170f',
    power: 'jouets', proj: 'ballon', projName: 'Ballon', stats: { hp: 88, spd: 1.16, dmg: .86, reach: .8, jump: 1.08 }, tag: 'Petit et rapide' },
  { id: 'soeur1', name: 'Raja', kind: 'human', build: 'slim', hair: 'long', top: 'leather', bottom: 'jeans', shoe: '#241c18', scale: .94, color: '#3e2b20', color2: '#2f3644', skin: '#bf9178', hairCol: '#22140c',
    power: 'selfie', proj: 'energy', projName: "Boule d'énergie", stats: { hp: 96, spd: 1.06, dmg: .98, reach: .96, jump: 1.04 }, tag: 'Technique' },
  { id: 'soeur2', name: 'Wafa', kind: 'human', build: 'slim', hair: 'ponytail', top: 'hoodie', bottom: 'jogging', shoe: '#5a564e', scale: .92, color: '#5c4a50', color2: '#2a2a2c', skin: '#c49a80', hairCol: '#140d09',
    power: 'tornade', proj: 'energy', projName: "Boule d'énergie", stats: { hp: 96, spd: 1.08, dmg: .96, reach: .96, jump: 1.06 }, tag: 'Acrobate' },
  { id: 'chats', name: 'Bouftiko & Poutine', catNames: ['Bouftiko', 'Poutine'], kind: 'cats', scale: 1, color: '#c97b3a', color2: '#7d7b80', skin: '#c97b3a', hairCol: '#7d7b80',
    power: 'griffes', proj: 'poils', projName: 'Boule de poils', stats: { hp: 90, spd: 1.22, dmg: .9, reach: .78, jump: 1.15 }, tag: 'Duo de chats' },
];

export const POWERS = {
  dragon: { name: 'Uppercut du Dragon', cost: 50, move: 'dragon', desc: "Décolle poing en l'air dans une gerbe de flammes. Imparable contre ceux qui sautent." },
  taureau: { name: 'Charge du Taureau', cost: 50, move: 'charge', desc: 'Fonce tête baissée en encaissant les coups sans broncher.' },
  jouets: { name: 'Pluie de jouets', cost: 100, move: 'summon', desc: "Des briques de jouet tombent du ciel sur l'adversaire." },
  selfie: { name: 'Selfie Flash', cost: 75, move: 'selfie', desc: "Le flash du téléphone éblouit l'adversaire s'il est en face." },
  tornade: { name: 'Tornade', cost: 50, move: 'tornade', desc: 'Tourne sur elle-même en avançant et frappe plusieurs fois.' },
  griffes: { name: 'Griffes en folie', cost: 50, move: 'griffes', desc: 'Bouftiko et Poutine foncent et griffent à tour de rôle.' },
};

// s = démarrage, a = actif, r = récupération (en images à 60 i/s)
export const MV = {
  punch: { s: 4, a: 4, r: 9, dmg: 6, reach: 84, lvl: 'mid', stun: 13, kb: 3.5, pose: 'punch' },
  kick: { s: 7, a: 5, r: 14, dmg: 10, reach: 110, lvl: 'mid', stun: 17, kb: 6, pose: 'kick' },
  cpunch: { s: 4, a: 4, r: 8, dmg: 5, reach: 80, lvl: 'mid', stun: 12, kb: 3, pose: 'cpunch', crouch: 1 },
  ckick: { s: 8, a: 5, r: 16, dmg: 9, reach: 114, lvl: 'low', stun: 18, kb: 5, pose: 'ckick', crouch: 1 },
  apunch: { s: 3, a: 9, r: 3, dmg: 7, reach: 76, lvl: 'high', stun: 14, kb: 3, pose: 'apunch', air: 1 },
  akick: { s: 4, a: 11, r: 3, dmg: 9, reach: 96, lvl: 'high', stun: 16, kb: 4, pose: 'akick', air: 1 },
  fire: { s: 14, a: 1, r: 20, pose: 'fire' },
  dragon: { s: 4, a: 18, r: 16, dmg: 15, reach: 78, lvl: 'mid', stun: 34, kb: 4, pose: 'fusee', anti: 1, launch: 1, power: 1 },
  charge: { s: 8, a: 22, r: 14, dmg: 16, reach: 66, lvl: 'mid', stun: 30, kb: 11, pose: 'charge', armor: 1, dash: 12, power: 1 },
  summon: { s: 18, a: 1, r: 22, pose: 'cast', power: 1 },
  selfie: { s: 16, a: 1, r: 24, pose: 'selfie', power: 1 },
  tornade: { s: 6, a: 32, r: 12, dmg: 5, reach: 98, lvl: 'mid', stun: 14, kb: 3, pose: 'tornade', multi: 8, dash: 4.5, power: 1 },
  griffes: { s: 6, a: 30, r: 14, dmg: 5, reach: 82, lvl: 'mid', stun: 13, kb: 2.5, pose: 'charge', multi: 6, dash: 8.5, power: 1 },
};

// angles des membres : 0 = vers le bas, + = vers l'avant
export const POSE = {
  idle: { lean: .12, fa1: .6, fa2: 2.5, ba1: .3, ba2: 2.3, fl1: .35, fl2: .05, bl1: -.35, bl2: -.15 },
  crouch: { lean: .35, fa1: .7, fa2: 2.6, ba1: .4, ba2: 2.4, fl1: 1.25, fl2: .1, bl1: .5, bl2: -1.2 },
  jump: { lean: .1, fa1: 1.0, fa2: 2.6, ba1: .5, ba2: 2.4, fl1: 1.2, fl2: -.4, bl1: .4, bl2: -1.0 },
  punch: { lean: .25, fa1: 1.55, fa2: 1.57, ba1: .2, ba2: 2.1, fl1: .5, fl2: .1, bl1: -.5, bl2: -.2 },
  punch_s: { lean: .05, fa1: .5, fa2: 2.9, ba1: .4, ba2: 2.3, fl1: .4, fl2: .05, bl1: -.4, bl2: -.15 },
  kick: { lean: -.35, fa1: .5, fa2: 2.4, ba1: -.6, ba2: 1.0, fl1: 1.6, fl2: 1.62, bl1: -.12, bl2: -.05 },
  kick_s: { lean: -.1, fa1: .5, fa2: 2.5, ba1: -.3, ba2: 1.6, fl1: 1.2, fl2: -.6, bl1: -.15, bl2: -.05 },
  cpunch: { lean: .45, fa1: 1.5, fa2: 1.55, ba1: .4, ba2: 2.3, fl1: 1.25, fl2: .1, bl1: .5, bl2: -1.2 },
  ckick: { lean: -.15, fa1: .6, fa2: 2.4, ba1: -.2, ba2: 1.4, fl1: 1.5, fl2: 1.58, bl1: .6, bl2: -1.3 },
  ckick_s: { lean: .2, fa1: .6, fa2: 2.4, ba1: .3, ba2: 2.2, fl1: 1.0, fl2: .3, bl1: .5, bl2: -1.2 },
  apunch: { lean: .3, fa1: 1.3, fa2: 1.35, ba1: .5, ba2: 2.4, fl1: 1.2, fl2: -.4, bl1: .4, bl2: -1.0 },
  akick: { lean: -.2, fa1: .8, fa2: 2.4, ba1: -.4, ba2: 1.5, fl1: 1.15, fl2: 1.05, bl1: .3, bl2: -1.1 },
  fire: { lean: .25, fa1: 1.6, fa2: 1.6, ba1: 1.5, ba2: 1.55, fl1: .55, fl2: .1, bl1: -.55, bl2: -.2 },
  fire_s: { lean: -.15, fa1: -.7, fa2: -1.0, ba1: -.9, ba2: -1.2, fl1: .4, fl2: .05, bl1: -.4, bl2: -.15 },
  block: { lean: -.08, fa1: .9, fa2: 3.0, ba1: .75, ba2: 2.95, fl1: .3, fl2: .05, bl1: -.4, bl2: -.2 },
  cblock: { lean: .2, fa1: .9, fa2: 3.0, ba1: .75, ba2: 2.95, fl1: 1.25, fl2: .1, bl1: .5, bl2: -1.2 },
  hit: { lean: -.5, fa1: -.5, fa2: -.1, ba1: -.9, ba2: -.4, fl1: .45, fl2: .1, bl1: -.45, bl2: -.2 },
  ko: { lean: -1.45, fa1: -2.2, fa2: -2.0, ba1: -2.5, ba2: -2.3, fl1: 1.35, fl2: 1.5, bl1: 1.2, bl2: 1.45 },
  win: { lean: 0, fa1: 2.9, fa2: 3.1, ba1: .3, ba2: 2.2, fl1: .3, fl2: .05, bl1: -.3, bl2: -.1 },
  charge: { lean: .75, fa1: 1.1, fa2: .9, ba1: .8, ba2: 1.5, fl1: .7, fl2: .2, bl1: -.7, bl2: -.3 },
  charge_s: { lean: .5, fa1: .4, fa2: .2, ba1: .3, ba2: .5, fl1: .9, fl2: .2, bl1: -.4, bl2: -.6 },
  fusee: { lean: .05, fa1: 2.95, fa2: 3.1, ba1: .5, ba2: 1.8, fl1: .9, fl2: -.2, bl1: -.2, bl2: -.4 },
  fusee_s: { lean: .4, fa1: .6, fa2: .3, ba1: .5, ba2: 2.3, fl1: 1.25, fl2: .1, bl1: .5, bl2: -1.2 },
  tornade: { lean: -.1, fa1: 1.6, fa2: 1.6, ba1: -1.6, ba2: -1.6, fl1: 1.55, fl2: 1.6, bl1: -.05, bl2: -.02 },
  cast: { lean: -.05, fa1: 2.2, fa2: 2.6, ba1: 2.2, ba2: 2.6, fl1: .35, fl2: .05, bl1: -.35, bl2: -.15 },
  selfie: { lean: -.05, fa1: 2.0, fa2: 2.2, ba1: .5, ba2: 2.6, fl1: .3, fl2: .05, bl1: -.35, bl2: -.15 },
  selfie_s: { lean: .05, fa1: 1.2, fa2: 2.4, ba1: .4, ba2: 2.4, fl1: .3, fl2: .05, bl1: -.35, bl2: -.15 },
};

export const STAGES = [
  { id: 'chambre', name: 'La chambre' },
  { id: 'videoclub', name: 'Le vidéoclub' },
  { id: 'parking', name: 'Le parking' },
  { id: 'wc', name: 'Les toilettes' },
  { id: 'photo', name: 'Ta photo' },
];
