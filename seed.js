// One-time master data: Trades, HajiriCodes, Sites, default TradeRateMaster
import { db } from "./firebase-config.js";
import { doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { list, insertRow, audit, today } from "./utils.js";

// HajiriCode, HoursWorked, Description  (HajiriUnits = HoursWorked / 2, computed in code like the SQL computed column)
export const HAJIRI = [["P3",3,"3-hour shift"],["P5",5,"5-hour shift"],["P5+2",7,"5 hrs + 2 hrs extra"],["P6",6,"6-hour shift"],
  ["P7",7,"7-hour shift"],["P8",8,"Full 8-hour shift"],["P8+2",10,"8 hrs + 2 hrs overtime"],["P12",12,"Double shift"]];
const TRADES = [["Fitter","Blue","SKILLED",195],["Carpenter","Yellow","SKILLED",150],["Green Labour","Green","UNSKILLED",110],
  ["Bankum Kadia","Mason B","SEMISKILLED",145],["Plaster Kadia","Mason A","SKILLED",200],["Crane Operator","Heavy","SKILLED",467]];

let running = false; // blocks double-clicks while seeding is in progress
export async function seedMasters() {
  if (running) throw new Error("Already loading, please wait.");
  running = true;
  try { await seed(); } finally { running = false; }
}
async function seed() {
  if ((await list("trades")).length) throw new Error("Master data already loaded.");
  for (const [code, hours, description] of HAJIRI) {
    const row = { hajiriCode: code, hoursWorked: hours, hajiriUnits: hours / 2, description };
    await setDoc(doc(db, "hajiriCodes", code), row); await audit("hajiriCodes", code, "INSERT", null, row);
  }
  for (const [tradeName, colorCode, skillLevel, rate] of TRADES) {
    const tradeId = await insertRow("trades", "tradeId", { tradeName, colorCode, skillLevel });
    await insertRow("tradeRateMaster", "tradeRateId", { tradeId, baseDailyRate: rate, effectiveFrom: "2026-01-01", effectiveTo: null });
  }
  for (const siteName of ["Kalher", "Dosti", "Thane"]) await insertRow("sites", "siteId", { siteName, location: siteName + ", Thane", createdDate: today() });
}

// Deletes master data and resets the ID counters (only allowed while no labour exists)
export async function resetMasters() {
  if ((await list("labours")).length) throw new Error("Cannot reset: labour records exist.");
  for (const t of ["sites", "trades", "tradeRateMaster", "hajiriCodes"])
    for (const r of await list(t)) await deleteDoc(doc(db, t, r._id));
  for (const c of ["sites", "trades", "tradeRateMaster"]) await deleteDoc(doc(db, "counters", c));
}
