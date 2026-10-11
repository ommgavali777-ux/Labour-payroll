// Shared helpers. Every table = one Firestore collection (same names as the SQL schema).
import { db, auth } from "./firebase-config.js";
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, runTransaction } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export const money = n => "₹" + (+n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const today = () => new Date().toISOString().slice(0, 10);

export function toast(msg, ok = true) {
  const t = document.createElement("div");
  t.className = `fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow text-white ${ok ? "bg-green-600" : "bg-red-600"}`;
  t.textContent = msg; document.body.append(t); setTimeout(() => t.remove(), 3500);
}

// SELECT * FROM table
export const list = async table => (await getDocs(collection(db, table))).docs.map(d => ({ _id: d.id, ...d.data() }));

// Emulates SQL IDENTITY(1,1): an atomic counter per table (runs as a transaction)
export const nextId = name => runTransaction(db, async t => {
  const ref = doc(db, "counters", name), s = await t.get(ref), n = (s.exists() ? s.data().value : 0) + 1;
  t.set(ref, { value: n }); return n;
});

// SystemAuditLogs: ActionType is INSERT / UPDATE / DELETE, ChangedBy = user id
export const audit = (table, recordId, action, oldV, newV) => addDoc(collection(db, "systemAuditLogs"), {
  tableName: table, recordId: String(recordId), actionType: action,
  oldValues: oldV ? JSON.stringify(oldV) : null, newValues: newV ? JSON.stringify(newV) : null,
  changedBy: auth.currentUser.uid, changedByName: auth.currentUser.email, changedAt: new Date().toISOString() });

// INSERT / UPDATE / DELETE — all three write an audit row automatically
export async function insertRow(table, pk, data) {
  const id = await nextId(table), row = { [pk]: id, ...data };
  await setDoc(doc(db, table, String(id)), row); await audit(table, id, "INSERT", null, row); return id;
}
export async function updateRow(table, id, patch, old) {
  await setDoc(doc(db, table, String(id)), patch, { merge: true }); await audit(table, id, "UPDATE", old, patch);
}
export async function deleteRow(table, id, old) {
  await deleteDoc(doc(db, table, String(id))); await audit(table, id, "DELETE", old, null);
}
