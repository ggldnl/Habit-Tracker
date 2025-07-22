import { Database } from "bun:sqlite";
import { existsSync } from "fs";


// Check if DB file exists before creating it
const DB_PATH = "db.sqlite";
const isFreshDatabase = !existsSync(DB_PATH);

const db = new Database(DB_PATH);

// Helper to fetch a single row
function getRowById(table: string, idField: string, id: number) {
  return db.query(`SELECT * FROM ${table} WHERE ${idField} = ?`).get(id);
}

// Initialize lists DB schema
db.run(`
CREATE TABLE IF NOT EXISTS colors (
  color_id INTEGER PRIMARY KEY AUTOINCREMENT,
  color_name TEXT NOT NULL,
  color_value TEXT NOT NULL
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS lists (
  list_id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_name TEXT NOT NULL,
  list_color INTEGER DEFAULT 0,
  FOREIGN KEY (list_color) REFERENCES colors(color_id)
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS entries (
  entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  entry_text TEXT NOT NULL,
  entry_checked BOOLEAN DEFAULT 0,
  FOREIGN KEY (list_id) REFERENCES lists(list_id) ON DELETE CASCADE
)
`);

// DB helper functions

export function getAllColors() {
  return db.query("SELECT * FROM colors").all();
}

export function getAllLists() {
  return db.query("SELECT * FROM lists").all();
}

export function getAllEntries() {
  return db.query("SELECT * FROM entries").all();
}

export function addColor(color_name: string, color_value: string = "#000000") {
  try {
    const stmt = db.prepare("INSERT INTO colors (color_name, color_value) VALUES (?, ?)");
    const result = stmt.run(color_name, color_value);
    return getRowById("colors", "color_id", result.lastInsertRowid as number);
  } catch {
    return null;
  }
}

export function addList(list_name: string, list_color: number = 1) {
  try {
    const stmt = db.prepare("INSERT INTO lists (list_name, list_color) VALUES (?, ?)");
    const result = stmt.run(list_name, list_color);
    return getRowById("lists", "list_id", result.lastInsertRowid as number);
  } catch {
    return null;
  }
}

export function addEntry(list_id: number, entry_text: string, entry_checked: boolean = false) {
  try {
    const stmt = db.prepare("INSERT INTO entries (list_id, entry_text, entry_checked) VALUES (?, ?, ?)");
    const result = stmt.run(list_id, entry_text, entry_checked ? 1 : 0);
    return getRowById("entries", "entry_id", result.lastInsertRowid as number);
  } catch {
    return null;
  }
}

export function updateEntryText(entry_id: number, new_text: string) {
  try {
    db.query("UPDATE entries SET entry_text = ? WHERE entry_id = ?").run(new_text, entry_id);
    return getRowById("entries", "entry_id", entry_id);
  } catch {
    return null;
  }
}

export function updateListName(list_id: number, new_name: string) {
  try {
    db.query("UPDATE lists SET list_name = ? WHERE list_id = ?").run(new_name, list_id);
    return getRowById("lists", "list_id", list_id);
  } catch {
    return null;
  }
}

export function setEntryChecked(entry_id: number, checked: boolean) {
  try {
    db.query("UPDATE entries SET entry_checked = ? WHERE entry_id = ?").run(checked ? 1 : 0, entry_id);
    return getRowById("entries", "entry_id", entry_id);
  } catch {
    return null;
  }
}

export function toggleEntry(entry_id: number) {
  try {
    db.query("UPDATE entries SET entry_checked = NOT entry_checked WHERE entry_id = ?").run(entry_id);
    return getRowById("entries", "entry_id", entry_id);
  } catch {
    return null;
  }
}

export function updateListColor(list_id: number, color_id: number) {
  try {
    db.query("UPDATE lists SET list_color = ? WHERE list_id = ?").run(color_id, list_id);
    return getRowById("lists", "list_id", list_id);
  } catch {
    return null;
  }
}

export function deleteColor(color_id: number) {
  try {
    const color = getRowById("colors", "color_id", color_id);
    db.query("DELETE FROM colors WHERE color_id = ?").run(color_id);
    return color;
  } catch {
    return null;
  }
}

export function deleteList(list_id: number) {
  try {
    const list = getRowById("lists", "list_id", list_id);
    db.query("DELETE FROM lists WHERE list_id = ?").run(list_id);
    return list;
  } catch {
    return null;
  }
}

export function deleteEntry(entry_id: number) {
  try {
    const entry = getRowById("entries", "entry_id", entry_id);
    db.query("DELETE FROM entries WHERE entry_id = ?").run(entry_id);
    return entry;
  } catch {
    return null;
  }
}

export function clearList(list_id: number) {
  try {
    const result = db.query("DELETE FROM entries WHERE list_id = ?").run(list_id);
    return result.changes;
  } catch {
    return 0;
  }
}

// Initialize habit tracker DB schema
db.run(`
CREATE TABLE IF NOT EXISTS habits (
  habit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_name TEXT NOT NULL,
  habit_color INTEGER DEFAULT 0,
  FOREIGN KEY (habit_color) REFERENCES colors(color_id)
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS days (
  day_id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL,
  day_value TEXT NOT NULL,
  day_completion REAL NOT NULL,
  FOREIGN KEY (habit_id) REFERENCES habits(habit_id) ON DELETE CASCADE
)
`);

export function getAllHabits() {
  return db.query("SELECT * FROM habits").all();
}

export function getAllDays() {
  return db.query("SELECT * FROM days").all();
}

export function addHabit(habit_name: string, habit_color: number = 1) {
  try {
    const stmt = db.prepare("INSERT INTO habits (habit_name, habit_color) VALUES (?, ?)");
    const result = stmt.run(habit_name, habit_color);
    return getRowById("habits", "habit_id", result.lastInsertRowid as number);
  } catch {
    return null;
  }
}

export function addDay(habit_id: number, day_value: string, day_completion: number = 1.0) {
  try {
    const stmt = db.prepare("INSERT INTO days (habit_id, day_value, day_completion) VALUES (?, ?, ?)");
    const result = stmt.run(habit_id, day_value, day_completion);
    return getRowById("days", "day_id", result.lastInsertRowid as number);
  } catch {
    return null;
  }
}

export function updateDayValue(day_id: number, new_value: string = "01/01/1999") {
  try {
    db.query("UPDATE days SET day_completion = ? WHERE day_id = ?").run(new_value, day_id);
    return getRowById("days", "day_id", day_id);
  } catch {
    return null;
  }
}

export function updateDayCompletion(day_id: number, new_completion: number = 1.0) {
  try {
    db.query("UPDATE days SET day_completion = ? WHERE day_id = ?").run(new_completion, day_id);
    return getRowById("days", "day_id", day_id);
  } catch {
    return null;
  }
}

export function updateHabitName(habit_id: number, new_name: string) {
  try {
    db.query("UPDATE habits SET habit_name = ? WHERE habit_id = ?").run(new_name, habit_id);
    return getRowById("habits", "habit_id", habit_id);
  } catch {
    return null;
  }
}

export function updateHabitColor(habit_id: number, color_id: number) {
  try {
    db.query("UPDATE habits SET habit_color = ? WHERE habit_id = ?").run(color_id, habit_id);
    return getRowById("habits", "habit_id", habit_id);
  } catch {
    return null;
  }
}

export function deleteHabit(habit_id: number) {
  try {
    const habit = getRowById("habits", "habit_id", habit_id);
    db.query("DELETE FROM habits WHERE habit_id = ?").run(habit_id);
    return habit;
  } catch {
    return null;
  }
}

export function deleteDay(day_id: number) {
  try {
    const day = getRowById("days", "day_id", day_id);
    db.query("DELETE FROM days WHERE day_id = ?").run(day_id);
    return day;
  } catch {
    return null;
  }
}

export function clearHabit(habit_id: number) {
  try {
    const result = db.query("DELETE FROM days WHERE habit_id = ?").run(habit_id);
    return result.changes;
  } catch {
    return 0;
  }
}

// Seed database

function getRandomDate(year: number, maxMonth: number, maxDay: number): string {
    
  const month = Math.floor(Math.random() * maxMonth) + 1;
  let daysInMonth = new Date(year, month, 0).getDate();
  if (month === maxMonth && maxDay < daysInMonth) {
    daysInMonth = maxDay;
  }

  const day = Math.floor(Math.random() * daysInMonth) + 1;

  // Format day and month with leading zeros
  const dayStr = day.toString().padStart(2, '0');
  const monthStr = month.toString().padStart(2, '0');

  return `${dayStr}/${monthStr}/${year}`;
}

function seedDatabase() {

  // Insert colors
  const color_red = addColor("red", "#f5716e");
  const color_orange = addColor("orange", "#fb933c");
  const color_yellow = addColor("yellow", "#fbbf23");
  const color_yellow2 = addColor("yellow2", "#facc16");
  const color_lime = addColor("lime", "#a3e636");
  const color_green = addColor("green", "#4ade80");
  const color_green2 = addColor("green2", "#34d399");
  const color_teal = addColor("teal", "#2dd4c0");
  const color_cyan = addColor("cyan", "#21d3cd");
  const color_blue = addColor("blue", "#38bbfb");
  const color_blue2 = addColor("blue2", "#61a5fa");
  const color_indigo = addColor("indigo", "#818cf8");
  const color_purple = addColor("purple", "#a78bfa");
  const color_purple2 = addColor("purple2", "#c085fd");

  // Insert two sample lists
  const list_1 = addList("🧾 Shopping List", 10);
  console.log("Sample list created: ", list_1);
  if (list_1) {
    addEntry(list_1.list_id, "🥛 Milk");
    addEntry(list_1.list_id, "🍞 Bread");
    addEntry(list_1.list_id, "🥐 ~Quaso~");
  }

  const list_2 = addList("🍿 Movies", 6);
  console.log("Sample list created: ", list_2);
  if (list_2) {
    addEntry(list_2.list_id, "👽 Alien (1979)");
    addEntry(list_2.list_id, "🔫 Aliens (1986)");
    addEntry(list_2.list_id, "⚰️ Alien³ (1992)");
    addEntry(list_2.list_id, "🧬 Alien: Resurrection (1997)");
    addEntry(list_2.list_id, "🗿 Prometheus (2012)");
    addEntry(list_2.list_id, "🤖 Alien: Covenant (2017)");
    addEntry(list_2.list_id, "🕳️ Alien: Romulus (2025)");
  }

  // Insert two random habits
  // TODO check cap date for random generation, should not exceed current date
  const habit_1 = addHabit("Reinforcement Learning", 6);
  console.log("Sample habit created: ", habit_1);
  if (habit_1) {
    const num_days_1 = Math.floor(Math.random() * 30) + 1;
    for (let i = 0; i < num_days_1; i++) {
      addDay(habit_1.habit_id, getRandomDate(1999, 12, 31));
    }
  }

  const habit_2 = addHabit("Robotics", 10);
  console.log("Sample habit created: ", habit_2);
  if (habit_2) {
    const num_days_2 = Math.floor(Math.random() * 30) + 1;
    for (let i = 0; i < num_days_2; i++) {
      addDay(habit_1.habit_id, getRandomDate(1999, 12, 31));
    }
  }


  console.log("Seeded database with sample data.");
}

// Seed the DB with initial sample data
if (isFreshDatabase) {
  seedDatabase();
}

export default db;
