// Login guard + role-based layout shared by every page
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const ALL = ["ADMIN", "SUPERVISOR", "FINANCE"];
// [page file, label, roles allowed]
export const NAV = [["dashboard","Dashboard",ALL],["sites","Sites",["ADMIN"]],["trades","Trades & Rates",["ADMIN"]],["labour","Labour",["ADMIN"]],
  ["supervisors","Supervisors",["ADMIN"]],["hajiri","Daily Hajiri",["ADMIN","SUPERVISOR"]],["advances","Advances",ALL],["extra-work","Extra Work",ALL],
  ["payroll","Payroll",["ADMIN","FINANCE"]],["audit-logs","Audit Logs",["ADMIN","FINANCE"]]];
// Add a page name here each time we finish building it
export const BUILT = ["dashboard", "sites", "trades", "labour", "supervisors", "hajiri", "advances", "extra-work", "payroll", "audit-logs"];

export function requireAuth(page, onReady) {
  onAuthStateChanged(auth, async user => {
    if (!user) return (location.href = "login.html");
    const snap = await getDoc(doc(db, "users", user.uid));           // role comes from the Users table
    if (!snap.exists() || snap.data().isActive === false) { await signOut(auth); return alert("No active account/role found. Ask the admin."); }
    const profile = snap.data(), role = String(profile.role).toUpperCase();
    const entry = NAV.find(n => n[0] === page);
    if (entry && !entry[2].includes(role)) return (location.href = "dashboard.html"); // unauthorized page
    document.getElementById("app").innerHTML = `
    <div class="md:flex min-h-screen">
      <aside id="side" class="hidden md:block bg-[#1e293b] border-r border-slate-700 md:w-60 p-4 shrink-0">
        <div class="font-bold text-white mb-4">Hajiri Payroll</div>
        <nav class="space-y-1">${NAV.filter(n => n[2].includes(role)).map(n => BUILT.includes(n[0])
          ? `<a href="${n[0]}.html" class="block px-3 py-2 rounded-lg ${n[0] === page ? "bg-indigo-600 text-white" : "hover:bg-slate-700"}">${n[1]}</a>`
          : `<span class="block px-3 py-2 text-slate-600">${n[1]} <small>(soon)</small></span>`).join("")}</nav>
        <button id="logout" class="mt-6 text-red-400">Logout</button>
        <div class="text-xs text-slate-500 mt-2">${profile.fullName || user.email}<br>${role}</div>
      </aside>
      <main class="flex-1 p-4 min-w-0">
        <button class="md:hidden bg-slate-700 px-3 py-2 rounded-lg mb-3" onclick="document.getElementById('side').classList.toggle('hidden')">☰ Menu</button>
        <div id="content"></div></main></div>`;
    document.getElementById("logout").onclick = () => signOut(auth);
    onReady({ user, role, profile, content: document.getElementById("content") });
  });
}
