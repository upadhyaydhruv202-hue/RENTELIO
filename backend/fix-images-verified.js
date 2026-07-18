/**
 * Second pass: assign verified Unsplash images by product-name keywords.
 * Names/brands already fixed by fix-product-catalog.js — this only refreshes images.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('./config/prisma');
const { ensureUploadDir, UPLOAD_DIR } = require('./services/productImage');

const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

/** Verified working photo IDs (checked HTTP 200). Multiple options for variety. */
const POOLS = {
  camera: ['photo-1516035069371-29a1b244cc32', 'photo-1502920917128-1aa500764cbd', 'photo-1492691527719-9d1e07e534b4'],
  lens: ['photo-1606983340126-99ab4feaa64a'],
  flash: ['photo-1542038784456-1ea8e935640e'],
  tripod: ['photo-1516035069371-29a1b244cc32'],
  laptop: ['photo-1517336714731-489689fd1ca8', 'photo-1496181133206-80ce9b88a853', 'photo-1588872657578-7efd1f1555ed'],
  tablet: ['photo-1544244015-0df4b3ffc6b0', 'photo-1561154464-82e9adf32764'],
  phone: ['photo-1511707171634-5f897ff02aa9', 'photo-1610945415295-d9bbf067e59c', 'photo-1598327105666-5b89351aff97'],
  watch: ['photo-1523275335684-37898b6baf30', 'photo-1434493789847-2f02dc6ca35d'],
  headphones: ['photo-1505740420928-5e560c06d30e', 'photo-1546435770-a3e426bf472b'],
  monitor: ['photo-1527443224154-c4a3942d3acf'],
  scooter: ['photo-1558981806-ec527fa84c39', 'photo-1571068316344-75bc76f77890'],
  motorcycle: ['photo-1558981359-219d6364c9c8', 'photo-1568772585407-9361f9bf3a87', 'photo-1558981403-c5f9899a28bc'],
  bicycle: ['photo-1485965120184-e220f721d03e'],
  sofa: ['photo-1555041469-a586c61ea9bc', 'photo-1493663284031-b7e3aefcae8e', 'photo-1540575467063-178a50c2df87'],
  dining: ['photo-1617806118233-18e1de247200', 'photo-1615066390971-03e4e1c36ddf'],
  chair: ['photo-1580480055273-228ff5388ef8', 'photo-1592078615290-033ee584e267'],
  recliner: ['photo-1567538096630-e0c55bd6374c'],
  bed: ['photo-1505693416388-ac5ce068fe85'],
  wardrobe: ['photo-1558997519-83ea9252edf8'],
  desk: ['photo-1592078615290-033ee584e267'],
  beanbag: ['photo-1631679706909-1844bbd07221'],
  drill: ['photo-1504148455328-c376907d081c', 'photo-1572981779307-38b8cabb2407'],
  saw: ['photo-1504328345606-18bbc8c9d7d1', 'photo-1581092918056-0c4c3acd3789'],
  construction: ['photo-1504307651254-35680f356dfd', 'photo-1541888946425-d81bb19240f5'],
  laser: ['photo-1581092160562-40aa08e78837'],
  tent: ['photo-1478131143081-80f7f84ca84d', 'photo-1504851149312-7a075b496cc7'],
  stove: ['photo-1475483768296-6163e08872a1'],
  cot: ['photo-1523987355523-c7b5b0dd90a7'],
  sleeping: ['photo-1504280390367-361c6d9f38f4'],
  backpack: ['photo-1553062407-98eeb64c6a62'],
  cooler: ['photo-1533900298318-6b8da08a523e'],
  trekking: ['photo-1551632811-561732d1e306'],
  lantern: ['photo-1504851149312-7a075b496cc7'],
  medical: ['photo-1576091160399-112ba8d25d1d', 'photo-1519494026892-80bbd2d6fd0d', 'photo-1559757148-5c350d0d3c56', 'photo-1579684385127-1ef15d508118'],
  wheelchair: ['photo-1576091160399-112ba8d25d1d', 'photo-1576091160550-2173dba999ef'],
  badminton: ['photo-1626224583764-f87db24ac4ea'],
  football: ['photo-1579952363873-27f3bade9f55'],
  cricket: ['photo-1531415074968-036ba1b575da'],
  tennis: ['photo-1626224583764-f87db24ac4ea'],
  yoga: ['photo-1601925260368-ae2f83cf8b7f'],
  gym: ['photo-1517836357463-d25dfeac3438', 'photo-1534438327276-14e5300c3a48'],
  treadmill: ['photo-1576678927484-cc907957088c'],
  basketball: ['photo-1546519638-68e109498ffc'],
  volleyball: ['photo-1612872087720-bb876e2e67d1'],
  guitar: ['photo-1564186763535-ebb21ef5277f'],
  keyboard: ['photo-1520523839897-bd0b52f945a0'],
  ukulele: ['photo-1556449895-a33c9dba33dd'],
  violin: ['photo-1612225330812-01a9c6b355ec'],
  drum: ['photo-1545454675-3531b543be5d'],
  flute: ['photo-1571330735066-03aaa9429d89'],
  amp: ['photo-1545454675-3531b543be5d'],
  acoustic: ['photo-1564186763535-ebb21ef5277f'],
  ac: ['photo-1631049307264-da0ec9d70304'],
  fridge: ['photo-1571175443880-49e1d25b2bc5'],
  washer: ['photo-1604335399105-a0c585fd81a1'],
  microwave: ['photo-1574269909862-7e1d70bb8078'],
  vacuum: ['photo-1581578731548-c64695cc6952'],
  heater: ['photo-1545259741-2ea3ebf61fa3'],
  purifier: ['photo-1602143407151-7111542de6e8'],
  kitchen: ['photo-1570222094114-d054a817e56b', 'photo-1585515320310-259814833e62', 'photo-1556910103-1c02745aae4d', 'photo-1517668808822-9ebb02f2a0e6', 'photo-1565193566173-7a0ee3dbe261'],
  speaker: ['photo-1545454675-3531b543be5d'],
  mic: ['photo-1590602847861-f357a9332bbc'],
  ledwall: ['photo-1558618666-fcd25c85cd64'],
  projector: ['photo-1517604931442-7e0c8ed2963c'],
  stagelight: ['photo-1492684223066-81342ee5ff30'],
  truss: ['photo-1501281668745-f7f57925c3b4'],
  dj: ['photo-1492684223066-81342ee5ff30'],
  fog: ['photo-1470229722913-7c0e2dbbafd3'],
  printer: ['photo-1612815154858-60aa4c59eaa6'],
  scanner: ['photo-1586281380349-632531db7ed4'],
  webcam: ['photo-1587825140708-dfaf72ae4b04'],
  office: ['photo-1454165804606-c3d57bc86b40', 'photo-1434030216411-0b793f4b4173', 'photo-1520923642038-b4259acecbd7'],
};

const RULES = [
  [/mirrorless|eos|a7|fx3|camera|x-t5|z6|r5|r6|a6700/i, 'camera'],
  [/lens|24-70|85mm|50mm/i, 'lens'],
  [/flash|strobe|speedlite|softbox|ad200/i, 'flash'],
  [/tripod|gimbal/i, 'tripod'],
  [/macbook|xps|thinkpad|laptop|zephyrus|spectre|surface pro/i, 'laptop'],
  [/ipad|galaxy tab|tablet/i, 'tablet'],
  [/oneplus|galaxy s|pixel|smartphone|phone/i, 'phone'],
  [/watch/i, 'watch'],
  [/airpods|headphones|wh-1000/i, 'headphones'],
  [/monitor/i, 'monitor'],
  [/activa|jupiter|access|scooty|pleasure|chetak|aerox|dio|scooter/i, 'scooter'],
  [/pulsar|apache|mt-15|splendor|classic 350|cb350|raider|xtreme|duke|motorcycle/i, 'motorcycle'],
  [/cycle|mtb|bicycle/i, 'bicycle'],
  [/sofa|kivik/i, 'sofa'],
  [/dining/i, 'dining'],
  [/recliner|poäng|lounge chair|accent/i, 'recliner'],
  [/office chair|ergomesh|markus|chair/i, 'chair'],
  [/bed|hemnes|malabar/i, 'bed'],
  [/wardrobe/i, 'wardrobe'],
  [/desk|study/i, 'desk'],
  [/bean bag/i, 'beanbag'],
  [/rotary hammer|demolition|drill|impact|nailer|screwdriver|multi-tool|hammer/i, 'drill'],
  [/saw|grinder|cutter|tile|sander|planer|router|mitre/i, 'saw'],
  [/laser/i, 'laser'],
  [/scaffold|mixer|compactor|generator|construction/i, 'construction'],
  [/tent/i, 'tent'],
  [/stove/i, 'stove'],
  [/cot|camp bed/i, 'cot'],
  [/sleeping|pad/i, 'sleeping'],
  [/backpack|hiking pack|day hiking/i, 'backpack'],
  [/cooler/i, 'cooler'],
  [/trekking|poles/i, 'trekking'],
  [/lantern/i, 'lantern'],
  [/wheelchair/i, 'wheelchair'],
  [/oxygen|nebulizer|cpap|bp |glucometer|thermometer|ecg|medical|hospital|fowler|walking stick/i, 'medical'],
  [/badminton|shuttle/i, 'badminton'],
  [/football/i, 'football'],
  [/cricket|batting/i, 'cricket'],
  [/table tennis/i, 'tennis'],
  [/yoga/i, 'yoga'],
  [/dumbbell|gym|skipping/i, 'gym'],
  [/treadmill/i, 'treadmill'],
  [/basketball/i, 'basketball'],
  [/volleyball/i, 'volleyball'],
  [/ukulele/i, 'ukulele'],
  [/violin/i, 'violin'],
  [/flute/i, 'flute'],
  [/drum|cajon|djembe/i, 'drum'],
  [/keyboard|piano|ct-x|sa-76|p-45/i, 'keyboard'],
  [/amp|mustang lt/i, 'amp'],
  [/guitar|bass guitar|pacifica|stratocaster|f310|ad810/i, 'guitar'],
  [/split ac|window ac|inverter ac|\bac\b/i, 'ac'],
  [/fridge|refrigerator/i, 'fridge'],
  [/washing/i, 'washer'],
  [/microwave|otg/i, 'microwave'],
  [/vacuum/i, 'vacuum'],
  [/heater/i, 'heater'],
  [/air purifier|water purifier|ro |uv water/i, 'purifier'],
  [/mixer|air fryer|induction|coffee|blender|rice cooker|kettle|juicer|toaster|sandwich|pressure cooker|food processor|wet grinder/i, 'kitchen'],
  [/led wall|led panel|novastar|absen/i, 'ledwall'],
  [/stage.*light|par light|moving head|chauvet/i, 'stagelight'],
  [/truss/i, 'truss'],
  [/pa speaker|column speaker|speaker/i, 'speaker'],
  [/mic|microphone|shure|sennheiser/i, 'mic'],
  [/projector/i, 'projector'],
  [/dj|ddj|mixtrack|numark|pioneer/i, 'dj'],
  [/fog/i, 'fog'],
  [/printer|laserjet|ink tank|mfc|label/i, 'printer'],
  [/scanner/i, 'scanner'],
  [/conference cam|rally bar|meetup|webcam/i, 'webcam'],
  [/shredder|whiteboard|laminator|desk phone|speakerphone|voip|cisco|poly/i, 'office'],
];

function poolFor(name, category) {
  for (const [re, key] of RULES) {
    if (re.test(name)) return POOLS[key] || POOLS.laptop;
  }
  const fallbacks = {
    Photography: 'camera',
    Electronics: 'laptop',
    Vehicles: 'scooter',
    Furniture: 'sofa',
    'Construction Equipment': 'construction',
    'Power Tools': 'drill',
    'Camping Gear': 'tent',
    'Medical Equipment': 'medical',
    'Sports Equipment': 'football',
    'Musical Instruments': 'guitar',
    'Home Appliances': 'fridge',
    'Kitchen Appliances': 'kitchen',
    'Event Equipment': 'stagelight',
    'Office Equipment': 'printer',
  };
  return POOLS[fallbacks[category] || 'laptop'];
}

async function download(url, dest) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'RentelioVerifiedImages/1.0' },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) throw new Error('small');
    fs.writeFileSync(dest, buf);
    return true;
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  ensureUploadDir();
  await prisma.$connect();
  const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
  const cache = new Map();
  let ok = 0;
  let fail = 0;

  console.log(`Refreshing verified images for ${products.length} products…`);

  for (const p of products) {
    const pool = poolFor(p.name, p.category);
    const photoId = pool[p.id % pool.length];
    const url = U(photoId);
    const filename = `cat-${p.id}.jpg`;
    const dest = path.join(UPLOAD_DIR, filename);
    const publicPath = `/uploads/products/${filename}`;

    try {
      if (cache.has(photoId) && fs.existsSync(cache.get(photoId))) {
        fs.copyFileSync(cache.get(photoId), dest);
      } else {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        await download(url, dest);
        cache.set(photoId, dest);
      }
      await prisma.product.update({ where: { id: p.id }, data: { image: publicPath } });
      ok += 1;
    } catch (e) {
      fail += 1;
      console.warn(`! ${p.id} ${p.name}: ${e.message}`);
      // try next in pool
      for (const alt of pool) {
        try {
          await download(U(alt), dest);
          cache.set(alt, dest);
          await prisma.product.update({ where: { id: p.id }, data: { image: publicPath } });
          ok += 1;
          fail -= 1;
          break;
        } catch {
          /* continue */
        }
      }
    }
    if (ok % 40 === 0) console.log(`… ${ok}`);
    await new Promise((r) => setTimeout(r, 35));
  }

  // Show one sample per category
  const cats = [...new Set(products.map((p) => p.category))];
  for (const cat of cats) {
    const rows = await prisma.product.findMany({
      where: { category: cat },
      take: 3,
      select: { name: true, image: true },
    });
    console.log(`\n${cat}`);
    rows.forEach((r) => console.log(`  ${r.name}`));
  }

  console.log(`\nDone ok=${ok} fail=${fail}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
