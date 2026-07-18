/**
 * Rebuild coherent product names + type-accurate images for ALL categories.
 * Updates name/brand/description/image only — keeps product IDs (rentals stay valid).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const prisma = require('./config/prisma');
const { ensureUploadDir, UPLOAD_DIR } = require('./services/productImage');
const { calcSecurityDeposit } = require('./utils/pricing');

/** Coherent catalog: brand always matches the product model. */
const CATALOG = {
  Photography: [
    { brand: 'Canon', item: 'EOS R5 Mirrorless Body', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Sony', item: 'A7 IV Mirrorless Kit', img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Nikon', item: 'Z6 II Mirrorless Body', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Fujifilm', item: 'X-T5 Camera Body', img: 'https://images.unsplash.com/photo-1606986628025-35d57e735ae0?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Canon', item: 'RF 24-70mm f/2.8 Lens', img: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Sony', item: 'FE 85mm f/1.8 Prime Lens', img: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Godox', item: 'AD200 Pro Strobe Flash', img: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Manfrotto', item: 'Carbon Fibre Tripod', img: 'https://images.unsplash.com/photo-1471341173079-06a0ac019000?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Sony', item: 'FX3 Cinema Camera', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Canon', item: 'EOS R6 Mark II Body', img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80' },
    { brand: 'DJI', item: 'RS 3 Gimbal Stabilizer', img: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Godox', item: 'Softbox Lighting Kit', img: 'https://images.unsplash.com/photo-1471341173079-06a0ac019000?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Nikon', item: 'Z 50mm f/1.8 S Lens', img: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Canon', item: 'Speedlite EL-5 Flash', img: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Sony', item: 'A6700 Mirrorless Body', img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Peak Design', item: 'Travel Tripod Aluminium', img: 'https://images.unsplash.com/photo-1471341173079-06a0ac019000?auto=format&fit=crop&w=800&q=80' },
  ],
  Electronics: [
    { brand: 'Apple', item: 'MacBook Pro 14" M3', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Dell', item: 'XPS 15 Laptop', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Lenovo', item: 'ThinkPad X1 Carbon', img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Apple', item: 'iPad Pro 12.9"', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Samsung', item: 'Galaxy Tab S9', img: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=800&q=80' },
    { brand: 'OnePlus', item: '12 Smartphone', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Samsung', item: 'Galaxy S24 Ultra', img: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Apple', item: 'AirPods Max', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Samsung', item: 'Galaxy Watch 6', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Apple', item: 'Apple Watch Ultra 2', img: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'LG', item: '27" 4K UltraFine Monitor', img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Sony', item: 'WH-1000XM5 Headphones', img: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80' },
    { brand: 'ASUS', item: 'ROG Zephyrus G14', img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Microsoft', item: 'Surface Pro 9', img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Google', item: 'Pixel 8 Pro', img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80' },
    { brand: 'HP', item: 'Spectre x360 Laptop', img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80' },
  ],
  Vehicles: [
    { brand: 'Honda', item: 'Activa 6G Scooter', img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80' },
    { brand: 'TVS', item: 'Jupiter 125 Scooter', img: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Bajaj', item: 'Pulsar NS200', img: 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Yamaha', item: 'MT-15 V2', img: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Hero', item: 'Splendor Plus', img: 'https://images.unsplash.com/photo-1449426468159-d96dbf6434b1?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Suzuki', item: 'Access 125 Scooter', img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80' },
    { brand: 'TVS', item: 'Apache RTR 160 4V', img: 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Hero', item: 'Pleasure+ Scooter', img: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Royal Enfield', item: 'Classic 350', img: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Honda', item: 'CB350RS', img: 'https://images.unsplash.com/photo-1449426468159-d96dbf6434b1?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Bajaj', item: 'Chetak Electric Scooter', img: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Yamaha', item: 'Aerox 155 Scooter', img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80' },
    { brand: 'TVS', item: 'Raider 125', img: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Hero', item: 'Xtreme 160R', img: 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Honda', item: 'Dio Scooter', img: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=800&q=80' },
    { brand: 'KTM', item: 'Duke 200', img: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80' },
  ],
  Furniture: [
    { brand: 'IKEA', item: 'Kivik 3-Seater Sofa', img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Godrej', item: 'Interio Dining Table Set', img: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Nilkamal', item: 'ErgoMesh Office Chair', img: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Urban Ladder', item: 'Malabar Queen Bed', img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Pepperfry', item: 'Solid Wood Wardrobe', img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d8?auto=format&fit=crop&w=800&q=80' },
    { brand: 'IKEA', item: 'Poäng Recliner Chair', img: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Nilkamal', item: 'Study Desk with Drawer', img: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba55c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Godrej', item: 'Bean Bag XL', img: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Pepperfry', item: 'Leather Recliner Sofa', img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Urban Ladder', item: '6-Seater Dining Set', img: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80' },
    { brand: 'IKEA', item: 'Markus Office Chair', img: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Godrej', item: 'Executive Office Desk', img: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba55c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Nilkamal', item: 'Plastic Storage Wardrobe', img: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Pepperfry', item: 'L-Shaped Sofa', img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Urban Ladder', item: 'Accent Lounge Chair', img: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'IKEA', item: 'Hemnes Bed Frame', img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80' },
  ],
  'Construction Equipment': [
    { brand: 'Bosch', item: 'GBH 2-26 Rotary Hammer', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Hilti', item: 'TE 2 Rotary Hammer', img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Makita', item: 'Electric Tile Cutter', img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Stanley', item: 'Cross Line Laser Level', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80' },
    { brand: 'JCB', item: 'Portable Concrete Mixer', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Honda', item: '5kVA Portable Generator', img: 'https://images.unsplash.com/photo-1473341302250-a0c480d57dc6?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Bosch', item: 'GSH Demolition Hammer', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Hilti', item: 'Scaffold Frame Set', img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Makita', item: 'Plate Compactor', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Stanley', item: 'Wet Tile Saw Cutter', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Bosch', item: 'GLL 3-80 Laser Level', img: 'https://images.unsplash.com/photo-1581092162384-89867c104447?auto=format&fit=crop&w=800&q=80' },
    { brand: 'JCB', item: 'Site Generator 7.5kVA', img: 'https://images.unsplash.com/photo-1473341302250-a0c480d57dc6?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Hilti', item: 'TE 3000 Demolition Hammer', img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Makita', item: 'Rotary Hammer HR2470', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Stanley', item: 'Aluminium Scaffold Tower', img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Bosch', item: 'GWS Angle Grinder Kit', img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80' },
  ],
  'Power Tools': [
    { brand: 'Bosch', item: 'GSB 13 RE Drill Kit', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Makita', item: '18V Impact Driver', img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Dewalt', item: '20V Circular Saw', img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Black+Decker', item: 'Heat Gun Kit', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Hitachi', item: 'Orbital Sander', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Bosch', item: 'GST 700 Jigsaw', img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Makita', item: 'Angle Grinder 4-inch', img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Dewalt', item: 'Multi-Tool Oscillating', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Bosch', item: 'Cordless Drill Driver', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Makita', item: 'Reciprocating Saw', img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Dewalt', item: 'Brad Nailer Kit', img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Hitachi', item: 'Router Woodworking', img: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Black+Decker', item: 'Electric Screwdriver Set', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Bosch', item: 'Belt Sander', img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Makita', item: 'Planer Electric', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Dewalt', item: 'Mitre Saw Compact', img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80' },
  ],
  'Camping Gear': [
    { brand: 'Quechua', item: '4-Person Dome Tent', img: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Coleman', item: 'LED Camping Lantern', img: 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Decathlon', item: 'Camping Gas Stove', img: 'https://images.unsplash.com/photo-1475483768296-6163e08872a1?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Wildcraft', item: 'Folding Camp Cot', img: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Naturehike', item: 'Sleeping Bag 0°C', img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Quechua', item: '60L Hiking Backpack', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Coleman', item: 'Hard Cooler Box 50L', img: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Decathlon', item: 'Trekking Poles Pair', img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Naturehike', item: '2-Person Tunnel Tent', img: 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Wildcraft', item: 'Rechargeable Lantern', img: 'https://images.unsplash.com/photo-1445307806294-bff7f67ff645?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Quechua', item: 'Portable Camping Stove', img: 'https://images.unsplash.com/photo-1475483768296-6163e08872a1?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Coleman', item: 'Folding Camp Bed', img: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Decathlon', item: 'Family Tent 6-Person', img: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Naturehike', item: 'Inflatable Sleeping Pad', img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Wildcraft', item: 'Day Hiking Pack 30L', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Coleman', item: 'Propane Camp Stove', img: 'https://images.unsplash.com/photo-1475483768296-6163e08872a1?auto=format&fit=crop&w=800&q=80' },
  ],
  'Medical Equipment': [
    { brand: 'Omron', item: 'Blood Pressure Monitor', img: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Philips', item: 'Oxygen Concentrator 5L', img: 'https://images.unsplash.com/photo-1581595220892-b2459bb5edd3?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Dr Trust', item: 'Foldable Wheelchair', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'BPL', item: 'Hospital Patient Bed', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Morepen', item: 'Pulse Oximeter', img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Philips', item: 'Nebulizer Compressor', img: 'https://images.unsplash.com/photo-1581595220892-b2459bb5edd3?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Omron', item: 'Glucometer Starter Kit', img: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80' },
    { brand: 'ResMed', item: 'CPAP Machine', img: 'https://images.unsplash.com/photo-1581595220892-b2459bb5edd3?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Dr Trust', item: 'Manual Wheelchair Steel', img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80' },
    { brand: 'BPL', item: 'Digital BP Apparatus', img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Philips', item: 'Home Oxygen Kit', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Omron', item: 'Infrared Thermometer', img: 'https://images.unsplash.com/photo-1584036561560-a75df1b79026?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Morepen', item: 'Nebulizer Mesh Portable', img: 'https://images.unsplash.com/photo-1581595220892-b2459bb5edd3?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Dr Trust', item: 'Walking Stick Adjustable', img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'BPL', item: 'ECG Machine Portable', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Philips', item: 'Hospital Fowler Bed', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80' },
  ],
  'Sports Equipment': [
    { brand: 'Yonex', item: 'Badminton Racket Pair', img: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Nivia', item: 'Football Size 5', img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80' },
    { brand: 'SG', item: 'English Willow Cricket Kit', img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Cosco', item: 'Table Tennis Set', img: 'https://images.unsplash.com/photo-1609710228159-0fa9bd16c416?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Adidas', item: 'Yoga Mat Pro 6mm', img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Nivia', item: 'Dumbbell Pair 10kg', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Cosco', item: 'Folding Treadmill', img: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Hercules', item: 'Indoor Cycle Trainer', img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Yonex', item: 'Badminton Net Set', img: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80' },
    { brand: 'SG', item: 'Cricket Batting Pads', img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Nivia', item: 'Basketball Size 7', img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Adidas', item: 'Skipping Rope Pro', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Cosco', item: 'Volleyball Soft Touch', img: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Yonex', item: 'Shuttlecock Tube', img: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Nivia', item: 'Gym Bench Adjustable', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Hercules', item: 'MTB Cycle 21-Speed', img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80' },
  ],
  'Musical Instruments': [
    { brand: 'Yamaha', item: 'F310 Acoustic Guitar', img: 'https://images.unsplash.com/photo-1510915361894-db8b50106daf?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Casio', item: 'CT-X700 Keyboard', img: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Fender', item: 'Stratocaster Electric Guitar', img: 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Kadence', item: 'Concert Ukulele', img: 'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Cort', item: 'AD810 Acoustic Guitar', img: 'https://images.unsplash.com/photo-1510915361894-db8b50106daf?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Yamaha', item: 'P-45 Digital Piano', img: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Kadence', item: 'Violin 4/4 Full Size', img: 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Pearl', item: 'Export Drum Kit', img: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47e7?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Yamaha', item: 'YFL-222 Flute', img: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Meinl', item: 'Cajon Percussion Box', img: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47e7?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Remo', item: 'Djembe Drum', img: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47e7?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Casio', item: 'SA-76 Mini Keyboard', img: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Fender', item: 'Mustang LT25 Amp', img: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Yamaha', item: 'Pacifica Electric Guitar', img: 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Kadence', item: 'Soprano Ukulele Pack', img: 'https://images.unsplash.com/photo-1556449895-a33c9dba33dd?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Cort', item: 'Bass Guitar Action PJ', img: 'https://images.unsplash.com/photo-1510915361894-db8b50106daf?auto=format&fit=crop&w=800&q=80' },
  ],
  'Home Appliances': [
    { brand: 'LG', item: '1.5 Ton Split AC', img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Samsung', item: '253L Refrigerator', img: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80' },
    { brand: 'IFB', item: 'Front Load Washing Machine', img: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Voltas', item: 'Window AC 1 Ton', img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Whirlpool', item: 'Microwave Convection 25L', img: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80' },
    { brand: 'LG', item: 'Air Purifier Dual Inverter', img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Kent', item: 'RO Water Purifier', img: 'https://images.unsplash.com/photo-1563351672-62b2341510c5?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Samsung', item: 'Robot Vacuum Cleaner', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Bajaj', item: 'Room Heater Fan', img: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=800&q=80' },
    { brand: 'LG', item: 'Top Load Washing Machine', img: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Voltas', item: 'Double Door Fridge', img: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80' },
    { brand: 'IFB', item: 'Built-in Microwave', img: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Whirlpool', item: 'Stick Vacuum Cleaner', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Samsung', item: '1.5 Ton Inverter AC', img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Kent', item: 'UV Water Purifier', img: 'https://images.unsplash.com/photo-1563351672-62b2341510c5?auto=format&fit=crop&w=800&q=80' },
  ],
  'Kitchen Appliances': [
    { brand: 'Philips', item: 'Mixer Grinder 750W', img: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Prestige', item: 'Air Fryer 4.2L', img: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Bajaj', item: 'Induction Cooktop', img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Morphy Richards', item: 'OTG Oven 28L', img: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Philips', item: 'Coffee Maker Drip', img: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Kent', item: 'Hand Blender', img: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Prestige', item: 'Electric Rice Cooker', img: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Bajaj', item: 'Electric Kettle 1.7L', img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Philips', item: 'Air Fryer XXL', img: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Morphy Richards', item: 'Food Processor', img: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Prestige', item: 'Sandwich Maker Grill', img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Kent', item: 'Slow Juicer', img: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Bajaj', item: 'Pop-up Toaster', img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Philips', item: 'Wet Grinder Classic', img: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Prestige', item: 'Pressure Cooker 5L', img: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80' },
  ],
  'Event Equipment': [
    { brand: 'JBL', item: 'EON715 PA Speaker Pair', img: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Shure', item: 'Wireless Mic Dual Set', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Absen', item: 'P3.9 Indoor LED Wall Panel', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Epson', item: 'EB-X06 Full HD Projector', img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Chauvet', item: 'LED Stage PAR Light Kit', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Antari', item: 'Fog Machine 1000W', img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Global Truss', item: 'Aluminium Truss Stand', img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Pioneer DJ', item: 'DDJ-FLX4 Controller', img: 'https://images.unsplash.com/photo-1571266028243-e4733b0cd02f?auto=format&fit=crop&w=800&q=80' },
    { brand: 'JBL', item: 'PRX One Column Speaker', img: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80' },
    { brand: 'BenQ', item: 'MH560 Business Projector', img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'NovaStar', item: 'Outdoor LED Wall Cabinet', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Chauvet', item: 'Moving Head Spot Light', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Sennheiser', item: 'Handheld Wireless Mic', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80' },
    { brand: 'ProX', item: 'Lighting Truss Triangle', img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Numark', item: 'Mixtrack Pro DJ Console', img: 'https://images.unsplash.com/photo-1571266028243-e4733b0cd02f?auto=format&fit=crop&w=800&q=80' },
  ],
  'Office Equipment': [
    { brand: 'HP', item: 'LaserJet Pro Printer', img: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Canon', item: 'Document Scanner', img: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Logitech', item: 'Meetup Conference Cam', img: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Epson', item: '100" Projector Screen', img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Brother', item: 'Label Printer QL-800', img: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Fellowes', item: 'Paper Shredder Cross-Cut', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Quartet', item: 'Magnetic Whiteboard Kit', img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Cisco', item: 'IP Desk Phone', img: 'https://images.unsplash.com/photo-1520923642038-b4259acecbd7?auto=format&fit=crop&w=800&q=80' },
    { brand: 'HP', item: 'Ink Tank Printer', img: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Canon', item: 'Flatbed Scanner Lide', img: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Logitech', item: 'Rally Bar Mini Cam', img: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Epson', item: 'Portable Projector Screen', img: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Brother', item: 'Multifunction Laser MFC', img: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Fellowes', item: 'Office Laminator', img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80' },
    { brand: 'Poly', item: 'Conference Speakerphone', img: 'https://images.unsplash.com/photo-1520923642038-b4259acecbd7?auto=format&fit=crop&w=800&q=80' },
  ],
};

async function download(url, dest) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'RentelioCatalogFix/2.0' },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) throw new Error('too small');
    fs.writeFileSync(dest, buf);
    return true;
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  ensureUploadDir();
  await prisma.$connect();

  const products = await prisma.product.findMany({
    orderBy: [{ category: 'asc' }, { id: 'asc' }],
  });

  const counters = {};
  const urlCache = new Map();
  let updated = 0;
  let imgFail = 0;

  for (const product of products) {
    const list = CATALOG[product.category];
    if (!list || !list.length) {
      console.warn('No catalog for', product.category);
      continue;
    }
    const idx = counters[product.category] || 0;
    counters[product.category] = idx + 1;
    const entry = list[idx % list.length];
    const unit = Math.floor(idx / list.length) + 1;
    const name = unit > 1 ? `${entry.brand} ${entry.item} (Unit ${unit})` : `${entry.brand} ${entry.item}`;
    const sku = `REN-${product.category.slice(0, 3).toUpperCase()}-${String(product.id).padStart(4, '0')}`;
    const description = `${entry.brand} ${entry.item} available for rent across India. Includes basic accessories and condition report. SKU ${sku}.`;

    const filename = `cat-${product.id}.jpg`;
    const dest = path.join(UPLOAD_DIR, filename);
    const publicPath = `/uploads/products/${filename}`;

    try {
      if (urlCache.has(entry.img) && fs.existsSync(urlCache.get(entry.img))) {
        fs.copyFileSync(urlCache.get(entry.img), dest);
      } else {
        await download(entry.img, dest);
        urlCache.set(entry.img, dest);
      }
    } catch (err) {
      imgFail += 1;
      console.warn(`img fail ${product.id} ${name}: ${err.message}`);
      // keep previous mapped file if any
      const prev = path.join(UPLOAD_DIR, `mapped-${product.id}.jpg`);
      if (fs.existsSync(prev) && fs.statSync(prev).size > 2000) {
        fs.copyFileSync(prev, dest);
      }
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        name,
        brand: entry.brand,
        description,
        image: fs.existsSync(dest) ? publicPath : product.image,
      },
    });
    updated += 1;
    if (updated % 25 === 0) console.log(`… ${updated}/${products.length}`);
    await new Promise((r) => setTimeout(r, 40));
  }

  // Sample per category
  console.log('\nSamples:');
  for (const cat of Object.keys(CATALOG)) {
    const sample = await prisma.product.findMany({
      where: { category: cat },
      take: 2,
      orderBy: { id: 'asc' },
      select: { name: true, brand: true, image: true },
    });
    console.log(`  ${cat}:`, sample.map((s) => s.name).join(' | '));
  }

  console.log(`\nDone. updated=${updated} imgFails=${imgFail}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
