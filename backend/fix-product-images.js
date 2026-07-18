/**
 * Fix product images ONLY — updates `products.image` to match name/category.
 * Does not change IDs, names, prices, stock, vendors, schema, or APIs.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('./config/prisma');
const { ensureUploadDir, UPLOAD_DIR } = require('./services/productImage');

/**
 * Curated Unsplash CDN URLs (royalty-free) keyed by visual product type.
 * Each URL clearly depicts that product type.
 */
const IMAGE_BY_TYPE = {
  // Photography
  'dslr-camera':
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  'mirrorless-camera':
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80',
  'camera-lens':
    'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&w=800&q=80',
  'tripod':
    'https://images.unsplash.com/photo-1606986628261-4f0f0f0f0f0f?auto=format&fit=crop&w=800&q=80',
  'flash-strobe':
    'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
  'cinema-camera':
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',

  // Electronics
  laptop:
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  tablet:
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
  smartphone:
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
  'smart-watch':
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  headphones:
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  monitor:
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',

  // Vehicles
  scooter:
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
  motorcycle:
    'https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&w=800&q=80',
  bicycle:
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
  car: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80',

  // Furniture
  sofa: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  'dining-set':
    'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
  'office-chair':
    'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=800&q=80',
  desk: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba55c?auto=format&fit=crop&w=800&q=80',
  wardrobe:
    'https://images.unsplash.com/photo-1595428774223-ef52624120d8?auto=format&fit=crop&w=800&q=80',
  bed: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
  recliner:
    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80',
  'bean-bag':
    'https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=800&q=80',
  'study-table':
    'https://images.unsplash.com/photo-1595428774223-ef52624120d8?auto=format&fit=crop&w=800&q=80',

  // Construction / power tools
  drill:
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
  'angle-grinder':
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80',
  generator:
    'https://images.unsplash.com/photo-1473341302250-a0c480d57dc6?auto=format&fit=crop&w=800&q=80',
  'concrete-mixer':
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  scaffold:
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80',
  'laser-level':
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80',
  'tile-cutter':
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80',
  saw: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80',
  'impact-driver':
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
  sander:
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80',
  'heat-gun':
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80',
  'multi-tool':
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
  'rotary-hammer':
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
  compactor:
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  'demolition-hammer':
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
  jigsaw:
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80',
  'circular-saw':
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80',

  // Camping
  tent: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80',
  'sleeping-bag':
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
  'camping-stove':
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80',
  backpack:
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  lantern:
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
  cooler:
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
  'folding-cot':
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80',
  'trekking-poles':
    'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',

  // Medical
  wheelchair:
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
  'oxygen-concentrator':
    'https://images.unsplash.com/photo-1581595220892-b2459bb5edd3?auto=format&fit=crop&w=800&q=80',
  'bp-monitor':
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80',
  nebulizer:
    'https://images.unsplash.com/photo-1581595220892-b2459bb5edd3?auto=format&fit=crop&w=800&q=80',
  'hospital-bed':
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
  oximeter:
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80',
  cpap: 'https://images.unsplash.com/photo-1581595220892-b2459bb5edd3?auto=format&fit=crop&w=800&q=80',
  glucometer:
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80',

  // Sports
  badminton:
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
  football:
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  cricket:
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
  'table-tennis':
    'https://images.unsplash.com/photo-1609710228159-0fa9bd16c416?auto=format&fit=crop&w=800&q=80',
  'yoga-mat':
    'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
  dumbbell:
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
  treadmill:
    'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&q=80',
  'cycle-trainer':
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',

  // Musical
  'acoustic-guitar':
    'https://images.unsplash.com/photo-1510915361894-db8b50106daf?auto=format&fit=crop&w=800&q=80',
  'electric-guitar':
    'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=800&q=80',
  keyboard:
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80',
  violin:
    'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&w=800&q=80',
  drum: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47e7?auto=format&fit=crop&w=800&q=80',
  flute:
    'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=800&q=80',
  ukulele:
    'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=800&q=80',
  cajon:
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47e7?auto=format&fit=crop&w=800&q=80',
  djembe:
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47e7?auto=format&fit=crop&w=800&q=80',

  // Home appliances
  ac: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
  refrigerator:
    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
  'washing-machine':
    'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=800&q=80',
  microwave:
    'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80',
  'air-purifier':
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
  'water-purifier':
    'https://images.unsplash.com/photo-1563351672-62b2341510c5?auto=format&fit=crop&w=800&q=80',
  vacuum:
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  heater:
    'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=800&q=80',

  // Kitchen
  'mixer-grinder':
    'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80',
  'air-fryer':
    'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
  induction:
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
  otg: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80',
  'coffee-maker':
    'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
  blender:
    'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
  'rice-cooker':
    'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
  kettle:
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',

  // Event
  speaker:
    'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
  microphone:
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
  'led-wall':
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
  projector:
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
  'stage-light':
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
  'fog-machine':
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
  truss:
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
  'dj-console':
    'https://images.unsplash.com/photo-1571266028243-e4733b0cd02f?auto=format&fit=crop&w=800&q=80',

  // Office
  printer:
    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80',
  scanner:
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80',
  'conference-cam':
    'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=800&q=80',
  'projector-screen':
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
  'label-printer':
    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80',
  shredder:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
  whiteboard:
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
  'voip-phone':
    'https://images.unsplash.com/photo-1520923642038-b4259acecbd7?auto=format&fit=crop&w=800&q=80',

  // Category fallbacks
  photography:
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  electronics:
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  vehicles:
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
  furniture:
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  'construction equipment':
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
  'power tools':
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
  'camping gear':
    'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80',
  'medical equipment':
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
  'sports equipment':
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  'musical instruments':
    'https://images.unsplash.com/photo-1510915361894-db8b50106daf?auto=format&fit=crop&w=800&q=80',
  'home appliances':
    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
  'kitchen appliances':
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
  'event equipment':
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80',
  'office equipment':
    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80',
};

/** Alternate Unsplash URLs for variety within the same type */
const ALTERNATES = {
  'dslr-camera': [
    'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
  ],
  laptop: [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  ],
  sofa: [
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
  ],
  scooter: [
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=800&q=80',
  ],
  motorcycle: [
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
  ],
  vacuum: [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  ],
};

const RULES = [
  [/eos|dslr|r5|z6|x-t5|a7|fx3|mirrorless|camera body|body\b/i, 'dslr-camera'],
  [/24-70|85mm|lens|prime/i, 'camera-lens'],
  [/ad200|flash|strobe|softbox|godox/i, 'flash-strobe'],
  [/tripod/i, 'tripod'],
  [/macbook|xps|thinkpad|laptop/i, 'laptop'],
  [/ipad|galaxy tab|tablet/i, 'tablet'],
  [/oneplus|iphone|smartphone|phone\b/i, 'smartphone'],
  [/watch/i, 'smart-watch'],
  [/airpods|headphone/i, 'headphones'],
  [/activa|jupiter|access|scooty|scooter/i, 'scooter'],
  [/pulsar|apache|mt-15|splendor|motorcycle|bike\b/i, 'motorcycle'],
  [/sofa/i, 'sofa'],
  [/dining/i, 'dining-set'],
  [/ergo chair|office chair|chair/i, 'office-chair'],
  [/desk|office desk/i, 'desk'],
  [/wardrobe/i, 'wardrobe'],
  [/recliner/i, 'recliner'],
  [/bean bag/i, 'bean-bag'],
  [/study table/i, 'study-table'],
  [/rotary hammer|demolition hammer|hammer/i, 'rotary-hammer'],
  [/concrete mixer/i, 'concrete-mixer'],
  [/tile cutter/i, 'tile-cutter'],
  [/scaffold/i, 'scaffold'],
  [/laser level/i, 'laser-level'],
  [/compactor/i, 'compactor'],
  [/generator/i, 'generator'],
  [/angle grinder|grinder/i, 'angle-grinder'],
  [/circular saw/i, 'circular-saw'],
  [/jigsaw/i, 'jigsaw'],
  [/impact driver/i, 'impact-driver'],
  [/heat gun/i, 'heat-gun'],
  [/sander/i, 'sander'],
  [/multi tool|drill kit|drill\b/i, 'drill'],
  [/tent/i, 'tent'],
  [/sleeping bag/i, 'sleeping-bag'],
  [/camping stove|stove/i, 'camping-stove'],
  [/hiking pack|backpack|pack 60/i, 'backpack'],
  [/lantern/i, 'lantern'],
  [/cooler/i, 'cooler'],
  [/folding cot|cot\b/i, 'folding-cot'],
  [/trekking/i, 'trekking-poles'],
  [/wheelchair/i, 'wheelchair'],
  [/oxygen/i, 'oxygen-concentrator'],
  [/bp monitor|blood pressure/i, 'bp-monitor'],
  [/nebulizer/i, 'nebulizer'],
  [/hospital bed/i, 'hospital-bed'],
  [/oximeter/i, 'oximeter'],
  [/cpap/i, 'cpap'],
  [/glucometer/i, 'glucometer'],
  [/badminton/i, 'badminton'],
  [/football/i, 'football'],
  [/cricket/i, 'cricket'],
  [/table tennis/i, 'table-tennis'],
  [/yoga/i, 'yoga-mat'],
  [/dumbbell/i, 'dumbbell'],
  [/treadmill/i, 'treadmill'],
  [/cycle trainer/i, 'cycle-trainer'],
  [/electric guitar/i, 'electric-guitar'],
  [/acoustic guitar|guitar/i, 'acoustic-guitar'],
  [/keyboard|61-key/i, 'keyboard'],
  [/violin/i, 'violin'],
  [/djembe|cajon|drum/i, 'drum'],
  [/flute/i, 'flute'],
  [/ukulele/i, 'ukulele'],
  [/ac 1\.5|air conditioner|\bac\b/i, 'ac'],
  [/refrigerator|fridge/i, 'refrigerator'],
  [/washing machine/i, 'washing-machine'],
  [/microwave/i, 'microwave'],
  [/air purifier/i, 'air-purifier'],
  [/water purifier/i, 'water-purifier'],
  [/vacuum/i, 'vacuum'],
  [/heater/i, 'heater'],
  [/mixer grinder/i, 'mixer-grinder'],
  [/air fryer/i, 'air-fryer'],
  [/induction/i, 'induction'],
  [/otg oven|otg\b/i, 'otg'],
  [/coffee/i, 'coffee-maker'],
  [/hand blender|blender/i, 'blender'],
  [/rice cooker/i, 'rice-cooker'],
  [/kettle/i, 'kettle'],
  [/pa speaker|speaker/i, 'speaker'],
  [/mic|microphone/i, 'microphone'],
  [/led wall/i, 'led-wall'],
  [/projector screen/i, 'projector-screen'],
  [/projector/i, 'projector'],
  [/stage light/i, 'stage-light'],
  [/fog/i, 'fog-machine'],
  [/truss/i, 'truss'],
  [/dj console/i, 'dj-console'],
  [/laser printer|printer/i, 'printer'],
  [/scanner/i, 'scanner'],
  [/conference cam/i, 'conference-cam'],
  [/label printer/i, 'label-printer'],
  [/shredder/i, 'shredder'],
  [/whiteboard/i, 'whiteboard'],
  [/voip|phone/i, 'voip-phone'],
];

// Fix broken placeholder URLs with known-good ones
IMAGE_BY_TYPE.tripod =
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80';

function resolveType(product) {
  const hay = `${product.name} ${product.brand || ''}`.trim();
  for (const [re, type] of RULES) {
    if (re.test(hay)) return type;
  }
  const cat = (product.category || '').toLowerCase();
  if (IMAGE_BY_TYPE[cat]) return cat;
  return 'electronics';
}

function resolveUrl(type, productId) {
  const primary = IMAGE_BY_TYPE[type] || IMAGE_BY_TYPE.electronics;
  const alts = ALTERNATES[type];
  if (!alts || !alts.length) return primary;
  const pool = [primary, ...alts];
  return pool[productId % pool.length];
}

async function downloadImage(url, destPath) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'RentelioImageFix/1.0' },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 800) throw new Error('file too small');
    fs.writeFileSync(destPath, buf);
    return true;
  } finally {
    clearTimeout(timer);
  }
}

/** Tiny valid JPEG fallback if download fails */
function writePlaceholder(destPath) {
  const tinyJpeg = Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBAQDxAQDw8QDw8PDw8PDw8PFREWFhURFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAADBAECBQYAB//EABUBAQEAAAAAAAAAAAAAAAAAAAAB/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQADAD8AfwD/2Q==',
    'base64'
  );
  fs.writeFileSync(destPath, tinyJpeg);
}

async function main() {
  ensureUploadDir();
  await prisma.$connect();
  const products = await prisma.product.findMany({
    select: { id: true, name: true, category: true, brand: true, image: true },
    orderBy: { id: 'asc' },
  });

  const forceTypes = new Set([
    'ukulele',
    'washing-machine',
    'vacuum',
    'air-purifier',
    'water-purifier',
    'ac',
    'laptop',
  ]);
  const forceAll = process.argv.includes('--all');

  console.log(`Fixing images for ${products.length} products…`);

  const cache = new Map();
  let ok = 0;
  let fail = 0;
  let skipped = 0;

  for (const product of products) {
    const type = resolveType(product);
    const filename = `mapped-${product.id}.jpg`;
    const dest = path.join(UPLOAD_DIR, filename);
    const publicPath = `/uploads/products/${filename}`;
    const existingOk = fs.existsSync(dest) && fs.statSync(dest).size >= 5000;
    if (!forceAll && existingOk && !forceTypes.has(type)) {
      if (product.image !== publicPath) {
        await prisma.product.update({ where: { id: product.id }, data: { image: publicPath } });
      }
      skipped += 1;
      continue;
    }

    const url = resolveUrl(type, product.id);
    const cacheKey = `${type}::${url}`;

    try {
      if (forceTypes.has(type) || forceAll || !existingOk) {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
      }
      if (cache.has(cacheKey) && fs.existsSync(cache.get(cacheKey)) && fs.statSync(cache.get(cacheKey)).size >= 5000) {
        fs.copyFileSync(cache.get(cacheKey), dest);
      } else {
        await downloadImage(url, dest);
        cache.set(cacheKey, dest);
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { image: publicPath },
      });
      ok += 1;
      if (ok % 20 === 0) console.log(`  … ${ok} updated`);
    } catch (err) {
      fail += 1;
      console.warn(`  ! id=${product.id} ${product.name}: ${err.message}`);
      try {
        const fallback =
          IMAGE_BY_TYPE[(product.category || '').toLowerCase()] || IMAGE_BY_TYPE.electronics;
        await downloadImage(fallback, dest);
        await prisma.product.update({
          where: { id: product.id },
          data: { image: publicPath },
        });
        ok += 1;
        fail -= 1;
      } catch {
        writePlaceholder(dest);
        await prisma.product.update({
          where: { id: product.id },
          data: { image: publicPath },
        });
      }
    }

    await new Promise((r) => setTimeout(r, 60));
  }

  const sample = await prisma.product.findMany({
    select: { id: true, name: true, category: true, image: true },
    orderBy: { id: 'asc' },
    take: 15,
  });
  console.log('\nSample mappings:');
  for (const s of sample) {
    console.log(`  [${resolveType(s)}] ${s.name} → ${s.image}`);
  }

  console.log(`\nDone. updated=${ok} skipped=${skipped} failed=${fail}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
