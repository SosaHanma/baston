# Baston de Famille

Jeu de combat en 3D façon PS2, avec toute la famille, dans des décors de nuit années 90 : la chambre, le vidéoclub, le parking et les toilettes.

**Jouer :** https://sosahanma.github.io/baston/

## Les combattants
| Perso | Style | Pouvoir |
|---|---|---|
| Hacéne | Équilibré | Uppercut du Dragon |
| Anis | Costaud | Charge du Taureau |
| Manil (petit frère) | Petit et rapide | Pluie de jouets |
| Raja | Technique | Selfie Flash |
| Wafa | Acrobate | Tornade |
| Bouftiko & Poutine (duo de chats) | Duo agile | Griffes en folie |

Dans l'**Atelier**, chacun peut recevoir sa photo (une pour Bouftiko, une pour Poutine), ses couleurs et un autre pouvoir.
Les photos restent dans le navigateur de chacun : elles ne sont jamais envoyées ni enregistrées dans ce dépôt.

## Commandes
| | Manette | Clavier J1 | Clavier J2 |
|---|---|---|---|
| Bouger / sauter / s'accroupir | Croix ou stick | Z Q S D | Flèches |
| Poing | X / □ | F | K |
| Pied | A / ✕ | G | L |
| Spécial | B / ○ | H | O |
| Pouvoir (jauge) | Y / △ / RB | J | P |
| Pause | Start | Échap | |

Reculer = se protéger. Arrière + bas protège des balayettes.

## Technique
Aucune dépendance : un petit moteur 3D WebGL maison (`js/gl.js`). Style par défaut « cassette VHS » inspiré des jeux PS1 rétro : image en 320×180, sommets qui tremblent, textures pixelisées et déformées, filtre magnétoscope. Les autres styles (PS1, PS2, HD) sont dans les options.
L'ancienne version 2D est dans [`classic/`](classic/).
