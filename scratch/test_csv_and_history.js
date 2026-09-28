import fs from "fs";
import path from "path";

// Mock browser globals for Node test
const mockStorage = {};
globalThis.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; }
};
globalThis.window = {};
globalThis.document = {
  createElement: () => ({
    setAttribute: () => {},
    appendChild: () => {},
    removeChild: () => {},
    click: () => {}
  }),
  body: {
    appendChild: () => {},
    removeChild: () => {}
  }
};
globalThis.Blob = class Blob {
  constructor(content, opts) {
    this.content = content.join("");
    this.type = opts.type;
  }
};
globalThis.URL = {
  createObjectURL: () => "blob:mock-url",
  revokeObjectURL: () => {}
};

import { HistoryManager, PRIMARY_HISTORY_KEY, LEGACY_HISTORY_KEY } from "../js/ui/historyManager.js";

console.log("==================================================");
console.log("EPE V3 — CSV IMPORT & HISTORY UNIFICATION TESTS");
console.log("==================================================");

let passed = 0;
let failed = 0;
function assert(cond, name) {
  if (cond) {
    console.log(`[PASS] ${name}`);
    passed++;
  } else {
    console.error(`[FAIL] ${name}`);
    failed++;
  }
}

// TEST 1: Storage Unification
console.log("\n--- TEST 1: Storage Unification ---");
const hm1 = new HistoryManager();
hm1.addEntry({
  studentId: "TestSiswa",
  questionId: "Q1",
  domainCode: "D1",
  primaryErrorCode: "E0",
  primaryErrorText: "Akurat",
  confidenceText: "95%"
});

assert(mockStorage[PRIMARY_HISTORY_KEY] !== undefined, "Data must be saved in PRIMARY_HISTORY_KEY (epe_history_v2)");
assert(mockStorage[LEGACY_HISTORY_KEY] !== undefined, "Data must be mirrored in LEGACY_HISTORY_KEY (epe_diagnosis_history)");

// TEST 2: Parsing data_riwayat_epe_excel_rapi.csv
console.log("\n--- TEST 2: Parsing data_riwayat_epe_excel_rapi.csv ---");
const csvPath = path.resolve("./data_riwayat_epe_excel_rapi.csv");
const csvContent = fs.readFileSync(csvPath, "utf-8");

const hm2 = new HistoryManager();
const result = hm2.importFromCSV(csvContent, true);

assert(result.success === true, "Import from CSV should succeed");
assert(result.count === 26, `Should parse exactly 26 student records (got: ${result.count})`);

// Validate row 1
const entry1 = result.entries[0];
assert(entry1.studentId === "Budi Santoso", `Row 1 student should be 'Budi Santoso' (got: ${entry1.studentId})`);
assert(entry1.questionId === "Q1", `Row 1 question should be 'Q1' (got: ${entry1.questionId})`);
assert(entry1.primaryErrorCode === "E1", `Row 1 error code should be 'E1' (got: ${entry1.primaryErrorCode})`);

// Validate Q24 (row 26)
const entry26 = result.entries[25];
assert(entry26.studentId === "Yusuf Mansur", `Row 26 student should be 'Yusuf Mansur' (got: ${entry26.studentId})`);
assert(entry26.questionId === "Q24", `Row 26 question should be 'Q24' (got: ${entry26.questionId})`);
assert(entry26.primaryErrorCode === "E1", `Row 26 error code should be 'E1' (got: ${entry26.primaryErrorCode})`);

// TEST 3: Stats calculation
console.log("\n--- TEST 3: Stats Calculation on 26 Records ---");
const stats = hm2.getStats();
assert(stats.total === 26, `Total records in stats should be 26 (got: ${stats.total})`);
assert(stats.counts.E0 > 0, `E0 count should be > 0 (got: ${stats.counts.E0})`);
assert(stats.counts.E1 > 0, `E1 count should be > 0 (got: ${stats.counts.E1})`);
assert(stats.counts.E2 > 0, `E2 count should be > 0 (got: ${stats.counts.E2})`);
assert(stats.counts.E3 > 0, `E3 count should be > 0 (got: ${stats.counts.E3})`);
assert(stats.counts.E4 > 0, `E4 count should be > 0 (got: ${stats.counts.E4})`);

// TEST 4: Export to CSV (18 columns)
console.log("\n--- TEST 4: Export to CSV Multimodal Format ---");
const exportRes = hm2.exportToCSV();
assert(exportRes.success === true, "Export to CSV should succeed");
assert(exportRes.count === 26, `Export count should be 26 (got: ${exportRes.count})`);

console.log("\n==================================================");
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("==================================================");

if (failed > 0) process.exit(1);
process.exit(0);
