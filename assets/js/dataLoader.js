// assets/js/dataLoader.js
// Utilities for loading CSV and common transforms (demo-friendly)

// Cache to avoid refetching
const _cache = {};

// Load CSV with PapaParse, return Promise<array of objects>
async function loadCSV(path) {
  if (_cache[path]) return _cache[path];
  return new Promise((resolve, reject) => {
    Papa.parse(path, {
      header: true,
      dynamicTyping: true,
      download: true,
      skipEmptyLines: true,
      complete: (res) => { _cache[path] = res.data; resolve(res.data); },
      error: (err) => reject(err)
    });
  });
}

// Parse dd/mm/yyyy
function parseDMY(dmy) {
  if (!dmy || typeof dmy !== "string") return null;
  const parts = dmy.split("/");
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// Format date as dd/mm/yyyy
function fmtDMY(date) {
  if (!(date instanceof Date) || isNaN(date)) return "-";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// Age from DOB (dd/mm/yyyy)
function ageFromDOB(dobStr) {
  const dob = parseDMY(dobStr);
  if (!dob) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

// BMI from kg & cm
function bmi(weightKg, heightCm) {
  const w = Number(weightKg), hcm = Number(heightCm);
  if (!isFinite(w) || !isFinite(hcm) || hcm <= 0) return null;
  const h = hcm / 100;
  return (w / (h*h)).toFixed(1);
}

// Get URL query param
function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Build link to dosage & trends page (your filename)
function dosageLink(patientId) {
  return `predicted-dosage-trend.html?patient=${encodeURIComponent(patientId)}`;
}

// Therapeutic range helper (Tacrolimus example)
function inTherapeuticRangeC0(c0) {
  const val = Number(c0);
  if (!isFinite(val)) return null;
  return val >= 5 && val <= 12;
}

// Parse a "5–12" or "5-12" range string
function parseRange(s) {
  if (!s) return null;
  const t = String(s).replace("–","-").split("-");
  if (t.length !== 2) return null;
  const lo = parseFloat(t[0]), hi = parseFloat(t[1]);
  if (!isFinite(lo) || !isFinite(hi)) return null;
  return { lo, hi };
}

// Is latest C0 in target for that row (uses row["Target Trough Range (ng/mL)"])
function inTargetForRow(row) {
  const rng = parseRange(row["Target Trough Range (ng/mL)"]);
  const c0 = Number(row["Drug Trough C0 (ng/mL)"]);
  if (!rng || !isFinite(c0)) return null;
  return c0 >= rng.lo && c0 <= rng.hi;
}

// Age-group check ("30-49", "70+")
function inAgeGroup(age, group) {
  if (age == null) return false;
  if (!group) return true;
  if (group.endsWith("+")) {
    const lo = parseInt(group);
    return age >= lo;
  }
  const [lo, hi] = group.split("-").map(Number);
  return age >= lo && age <= hi;
}

// Phenotype mappers (star-allele notation)
function phenoCYP3A5(g) {
  const s = String(g||"").replace(/\s/g,"");
  return s.includes("*1") ? "Expresser (functional)" : "Non-expresser (loss-of-function)";
}
function phenoCYP3A4(g) {
  const s = String(g||"").replace(/\s/g,"");
  if (s === "*22/*22") return "Markedly reduced (*22/*22)";
  if (s === "*1/*22" || s === "*22/*1") return "Reduced (*1/*22)";
  return "Normal (*1/*1)";
}
function phenoABCB1(g) {
  const s = String(g||"").replace(/\s/g,"");
  if (s === "*2/*2") return "P-gp low (higher absorption)";
  if (s === "*1/*2" || s === "*2/*1") return "P-gp intermediate";
  return "P-gp high (lower absorption)";
}

// Badge helper — returns [label, bootstrapClass]
function phenoBadge(phenoText) {
  if (!phenoText) return ["–","text-bg-secondary"];
  if (/Markedly|low \(higher/.test(phenoText)) return [phenoText, "text-bg-danger"];
  if (/Reduced|intermediate/.test(phenoText))   return [phenoText, "text-bg-warning"];
  if (/Normal|Expresser|high \(lower/.test(phenoText)) return [phenoText, "text-bg-success"];
  return [phenoText, "text-bg-secondary"];
}

window.TX = {
  loadCSV, parseDMY, fmtDMY, getParam, dosageLink,
  inTherapeuticRangeC0, parseRange, inTargetForRow,
  ageFromDOB, bmi, inAgeGroup,
  phenoCYP3A5, phenoCYP3A4, phenoABCB1, phenoBadge
};