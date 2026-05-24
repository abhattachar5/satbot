// progress.js -- SATBot Phase 0 local progress-tracking layer
// No dependencies. All methods return Promises for Phase 1 server swap-readiness.
// Include: <script src="/progress.js"></script>  then: new ProgressStore()

// Set true to enable verbose console output during development.
const DEBUG = false;

const STORAGE_KEY    = 'satbot_progress_v1';
const SCHEMA_VERSION = 1;

function log(...args) { if (DEBUG) console.log('[ProgressStore]', ...args); }

// --- Generators ---

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function generateAttemptId() {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateGoalId() {
  return `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// --- Date helpers ---

/** Returns "YYYY-MM-DD" in local timezone. */
function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adds n days to a "YYYY-MM-DD" string and returns a new "YYYY-MM-DD".
 * Appends T00:00:00 before parsing to avoid UTC-vs-local shifting.
 */
function addDaysToDateStr(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toDateString(d);
}

// --- Empty-store factory ---

function emptyStore() {
  return {
    schemaVersion:  SCHEMA_VERSION,
    deviceId:       generateUUID(),
    createdAt:      new Date().toISOString(),
    preferences: {
      displayName:      null,
      yearGroup:        'Y6',
      weeklyGoalPapers: 3
    },
    attempts:     [],
    sessions:     [],
    goals:        [],
    achievements: []
  };
}

// --- Pure aggregation helpers ---
// Extracted as standalone functions so they can be tested in isolation.

/**
 * Computes currentStreakDays and longestStreakDays from a list of attempts.
 * A "practice day" is any local-timezone calendar day with >=1 completed attempt.
 * currentStreakDays counts consecutive days ending today or yesterday.
 *
 * @param {Array}  attempts - full array of attempt objects
 * @param {Date}   now      - injectable clock for testing
 * @returns {{ currentStreakDays: number, longestStreakDays: number }}
 */
function computeStreak(attempts, now) {
  if (!attempts || attempts.length === 0) return { currentStreakDays: 0, longestStreakDays: 0 };

  const days = [...new Set(
    attempts
      .filter(a => a.completedAt)
      .map(a => toDateString(new Date(a.completedAt)))
  )].sort(); // ascending "YYYY-MM-DD"

  if (days.length === 0) return { currentStreakDays: 0, longestStreakDays: 0 };

  // Longest consecutive run across all history.
  let longestStreakDays = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (addDaysToDateStr(days[i - 1], 1) === days[i]) {
      run++;
      if (run > longestStreakDays) longestStreakDays = run;
    } else {
      run = 1;
    }
  }

  // Current streak: must end today or yesterday (today might not be over yet).
  const todayStr     = toDateString(now);
  const yesterdayStr = addDaysToDateStr(todayStr, -1);
  const newestDay    = days[days.length - 1];
  let currentStreakDays = 0;

  if (newestDay === todayStr || newestDay === yesterdayStr) {
    currentStreakDays = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      if (addDaysToDateStr(days[i], 1) === days[i + 1]) {
        currentStreakDays++;
      } else {
        break;
      }
    }
  }

  return {
    currentStreakDays,
    longestStreakDays: Math.max(longestStreakDays, currentStreakDays)
  };
}

/**
 * Aggregates per-topic mastery from all attempts.
 * Groups questionResults by (topic, subject) and computes accuracy.
 * Bands: <60% = needs_practice, 60-85% = getting_there, >85% = mastered.
 *
 * @param {Array} attempts
 * @returns {Array} sorted weakest-first by accuracyPercent
 */
function computeTopicMastery(attempts) {
  const map = {}; // key: "topic||subject"

  for (const attempt of attempts) {
    if (!Array.isArray(attempt.questionResults)) continue;
    for (const q of attempt.questionResults) {
      if (!q.topic) continue;
      const key = `${q.topic}||${attempt.subject}`;
      if (!map[key]) map[key] = { topic: q.topic, subject: attempt.subject, questionCount: 0, correctCount: 0 };
      map[key].questionCount++;
      if (q.correct) map[key].correctCount++;
    }
  }

  return Object.values(map).map(t => {
    const accuracyPercent = t.questionCount > 0
      ? Math.round((t.correctCount / t.questionCount) * 100)
      : 0;
    let band;
    if (accuracyPercent < 60)       band = 'needs_practice';
    else if (accuracyPercent <= 85) band = 'getting_there';
    else                            band = 'mastered';
    return { ...t, accuracyPercent, band };
  }).sort((a, b) => a.accuracyPercent - b.accuracyPercent); // weakest first
}

/**
 * Computes the trend for a chronologically-sorted list of attempts in one subject.
 * Requires >=4 attempts; compares average of last 3 vs all prior.
 *
 * @param {Array} subjectAttempts - must be in chronological order
 * @returns {"improving"|"flat"|"declining"|"insufficient_data"}
 */
function computeTrend(subjectAttempts) {
  if (subjectAttempts.length < 4) return 'insufficient_data';
  const pct = a => a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
  const avg = arr => arr.reduce((s, a) => s + pct(a), 0) / arr.length;
  const diff = avg(subjectAttempts.slice(-3)) - avg(subjectAttempts.slice(0, -3));
  if (diff >= 5)  return 'improving';
  if (diff <= -5) return 'declining';
  return 'flat';
}

/**
 * Runs all achievement rules against the store and mutates store.achievements
 * with any newly-earned entries. Each code is awarded at most once.
 *
 * @param {object} store - full store object (mutated in place)
 * @param {Date}   now
 * @returns {Array} achievement objects just awarded
 */
function evaluateAchievementRules(store, now) {
  const earned      = new Set(store.achievements.map(a => a.code));
  const newlyEarned = [];

  function award(code) {
    if (!earned.has(code)) {
      const a = { code, earnedAt: now.toISOString() };
      store.achievements.push(a);
      earned.add(code);
      newlyEarned.push(a);
      log('Achievement awarded:', code);
    }
  }

  const { attempts } = store;

  if (attempts.length >= 1) award('first_paper');
  if (attempts.length >= 5) award('five_papers');
  if (new Set(attempts.map(a => a.paperCode)).size >= 10) award('ten_papers');

  const { currentStreakDays, longestStreakDays } = computeStreak(attempts, now);
  const maxStreak = Math.max(currentStreakDays, longestStreakDays);
  if (maxStreak >= 3) award('three_streak');
  if (maxStreak >= 7) award('seven_streak');

  if (attempts.some(a => a.maxScore > 0 && a.score === a.maxScore)) award('first_full_marks');

  // Improver: average of last 3 in a subject beats average of prior 3. Award once.
  if (!earned.has('improver')) {
    for (const subject of [...new Set(attempts.map(a => a.subject))]) {
      const sub = attempts
        .filter(a => a.subject === subject)
        .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
      if (sub.length >= 6) {
        const pct = a => a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
        const avg = arr => arr.reduce((s, a) => s + pct(a), 0) / arr.length;
        if (avg(sub.slice(-3)) > avg(sub.slice(-6, -3))) { award('improver'); break; }
      }
    }
  }

  return newlyEarned;
}

// Achievement display metadata (names, icons, descriptions) for UI use.
const ACHIEVEMENT_META = {
  first_paper:      { name: 'First Paper Complete',  icon: '📄', description: 'Completed your first practice paper!' },
  five_papers:      { name: 'Getting Started',        icon: '🚀', description: 'Completed 5 practice papers!' },
  ten_papers:       { name: 'Ten-Paper Pro',          icon: '🏆', description: 'Completed 10 distinct papers!' },
  three_streak:     { name: '3-Day Streak',           icon: '🔥', description: 'Practised 3 days in a row!' },
  seven_streak:     { name: 'Week Warrior',           icon: '💪', description: 'Practised 7 days in a row!' },
  first_full_marks: { name: 'Perfect Score',          icon: '⭐',       description: 'Got full marks on a paper!' },
  improver:         { name: 'On the Up',              icon: '📈', description: 'Your last 3 results beat your previous 3!' }
};

// ==========================================================================
// ProgressStore
// ==========================================================================

class ProgressStore {
  /**
   * @param {object}   [options]
   * @param {function} [options._clock] - returns current Date; injectable for testing
   */
  constructor(options = {}) {
    this._clock              = options._clock || (() => new Date());
    this._corruptionDetected = false;
    this._store              = null; // loaded lazily on first access
  }

  // Internal: read from localStorage, handling corruption and schema migration.
  _read() {
    if (this._store !== null) return this._store;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { this._store = emptyStore(); return this._store; }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') throw new Error('Not an object');
      if (parsed.schemaVersion !== SCHEMA_VERSION) {
        // Placeholder for future migrations. Treat version mismatch as corrupt for v1.
        console.warn(`[ProgressStore] Schema version mismatch (expected ${SCHEMA_VERSION}, got ${parsed.schemaVersion}). Resetting.`);
        this._corruptionDetected = true;
        this._store = emptyStore();
        return this._store;
      }
      this._store = parsed;
      log('Store loaded, attempts:', parsed.attempts.length);
      return this._store;
    } catch (e) {
      console.warn('[ProgressStore] Corrupted data -- resetting store.', e.message);
      this._corruptionDetected = true;
      this._store = emptyStore();
      return this._store;
    }
  }

  // Internal: persist the in-memory store to localStorage.
  _write() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._store));
      log('Store written');
    } catch (e) {
      console.error('[ProgressStore] localStorage write failed:', e.message);
      throw e;
    }
  }

  _getStore() { return this._read(); }

  // --- Lifecycle ---

  /**
   * Returns true if any meaningful data exists (used for empty-state detection).
   * @returns {Promise<boolean>}
   */
  async hasData() {
    const s = this._getStore();
    return Promise.resolve(s.attempts.length > 0 || s.goals.length > 0 || s.preferences.displayName !== null);
  }

  /**
   * Returns true if the last read detected and recovered from corrupted JSON.
   * @returns {Promise<boolean>}
   */
  async wasCorruptionDetected() {
    this._read();
    return Promise.resolve(this._corruptionDetected);
  }

  // --- Attempts ---

  /**
   * Records a completed attempt. Generates id automatically.
   * @param {object} attempt - AttemptInput (all fields except id)
   * @returns {Promise<object>} the saved attempt including generated id
   */
  async recordAttempt(attempt) {
    const store = this._getStore();
    const saved = {
      id:              generateAttemptId(),
      paperCode:       attempt.paperCode,
      subject:         attempt.subject,
      score:           attempt.score,
      maxScore:        attempt.maxScore,
      startedAt:       attempt.startedAt   || new Date().toISOString(),
      completedAt:     attempt.completedAt || new Date().toISOString(),
      durationSeconds: attempt.durationSeconds ?? 0,
      questionResults: attempt.questionResults || [],
      retryOf:         attempt.retryOf || null
    };
    store.attempts.push(saved);
    this._write();
    log('recordAttempt', saved.id);
    return Promise.resolve(saved);
  }

  /**
   * Returns all attempts sorted newest-first.
   * @returns {Promise<Array>}
   */
  async getAllAttempts() {
    const store = this._getStore();
    return Promise.resolve(
      [...store.attempts].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    );
  }

  /**
   * Returns the N most recent attempts, newest first.
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getRecentAttempts(limit) {
    const all = await this.getAllAttempts();
    return Promise.resolve(all.slice(0, limit));
  }

  /**
   * Returns all attempts for a given subject, newest first.
   * @param {string} subject - "maths" | "reading" | "spag"
   * @returns {Promise<Array>}
   */
  async getAttemptsBySubject(subject) {
    const all = await this.getAllAttempts();
    return Promise.resolve(all.filter(a => a.subject === subject));
  }

  // --- Aggregations ---

  /**
   * High-level summary for the dashboard hero strip.
   * @returns {Promise<{ totalAttempts, totalPapersCompleted, overallAveragePercent, currentStreakDays, longestStreakDays, lastAttemptAt }>}
   */
  async getSummary() {
    const { attempts } = this._getStore();
    const now           = this._clock();
    const scoreable     = attempts.filter(a => typeof a.score === 'number' && a.maxScore > 0);
    const overallAveragePercent = scoreable.length > 0
      ? Math.round(scoreable.reduce((s, a) => s + (a.score / a.maxScore * 100), 0) / scoreable.length)
      : null;
    const { currentStreakDays, longestStreakDays } = computeStreak(attempts, now);
    const sorted = [...attempts].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    return Promise.resolve({
      totalAttempts:        attempts.length,
      totalPapersCompleted: new Set(attempts.map(a => a.paperCode)).size,
      overallAveragePercent,
      currentStreakDays,
      longestStreakDays,
      lastAttemptAt: sorted.length > 0 ? sorted[0].completedAt : null
    });
  }

  /**
   * Per-subject statistics including trend direction.
   * @returns {Promise<Array<{ subject, attemptCount, averagePercent, trend, lastAttemptAt }>>}
   */
  async getSubjectBreakdown() {
    const { attempts } = this._getStore();
    return Promise.resolve(['maths', 'reading', 'spag'].map(subject => {
      const sub = attempts
        .filter(a => a.subject === subject)
        .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
      const scoreable = sub.filter(a => a.maxScore > 0);
      const averagePercent = scoreable.length > 0
        ? Math.round(scoreable.reduce((s, a) => s + (a.score / a.maxScore * 100), 0) / scoreable.length)
        : 0;
      const newestFirst = [...sub].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      return {
        subject,
        attemptCount: sub.length,
        averagePercent,
        trend: computeTrend(sub),
        lastAttemptAt: newestFirst.length > 0 ? newestFirst[0].completedAt : null
      };
    }));
  }

  /**
   * Score-over-time series suitable for a line chart.
   * @param {object} [options]
   * @param {string} [options.subject]   - filter to one subject
   * @param {number} [options.limitDays] - only include last N days
   * @returns {Promise<Array<{ date, subject, percent, paperCode }>>}
   */
  async getScoreTimeline(options = {}) {
    let attempts = [...this._getStore().attempts];
    if (options.subject)   attempts = attempts.filter(a => a.subject === options.subject);
    if (options.limitDays) {
      const cutoff = new Date(this._clock());
      cutoff.setDate(cutoff.getDate() - options.limitDays);
      attempts = attempts.filter(a => new Date(a.completedAt) >= cutoff);
    }
    attempts.sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
    return Promise.resolve(
      attempts.filter(a => a.maxScore > 0).map(a => ({
        date:      a.completedAt,
        subject:   a.subject,
        percent:   Math.round((a.score / a.maxScore) * 100),
        paperCode: a.paperCode
      }))
    );
  }

  /**
   * Per-topic mastery aggregated across all attempts, sorted weakest-first.
   * @returns {Promise<Array<{ topic, subject, questionCount, correctCount, accuracyPercent, band }>>}
   */
  async getTopicMastery() {
    return Promise.resolve(computeTopicMastery(this._getStore().attempts));
  }

  // --- Goals ---

  /**
   * Creates and persists a new goal.
   * @param {object} goal - GoalInput fields
   * @returns {Promise<object>} saved goal with generated id
   */
  async createGoal(goal) {
    const store = this._getStore();
    const saved = {
      id:            generateGoalId(),
      subject:       goal.subject,
      targetPercent: goal.targetPercent,
      deadline:      goal.deadline,
      createdAt:     new Date().toISOString(),
      achievedAt:    null
    };
    store.goals.push(saved);
    this._write();
    return Promise.resolve(saved);
  }

  /**
   * Returns all goals that have not yet been achieved.
   * @returns {Promise<Array>}
   */
  async getActiveGoals() {
    return Promise.resolve(this._getStore().goals.filter(g => !g.achievedAt));
  }

  /**
   * Returns current progress toward a specific goal.
   * @param {string} goalId
   * @returns {Promise<{ goal, currentPercent, onTrack }>}
   */
  async getGoalProgress(goalId) {
    const store = this._getStore();
    const goal  = store.goals.find(g => g.id === goalId);
    if (!goal) return Promise.reject(new Error(`Goal not found: ${goalId}`));
    const sub = store.attempts.filter(a => a.subject === goal.subject && a.maxScore > 0);
    const currentPercent = sub.length > 0
      ? Math.round(sub.reduce((s, a) => s + (a.score / a.maxScore * 100), 0) / sub.length)
      : 0;
    const daysRemaining = Math.ceil((new Date(goal.deadline) - this._clock()) / 86400000);
    return Promise.resolve({
      goal,
      currentPercent,
      onTrack: currentPercent >= goal.targetPercent || daysRemaining > 14
    });
  }

  /**
   * Deletes a goal permanently.
   * @param {string} goalId
   * @returns {Promise<void>}
   */
  async deleteGoal(goalId) {
    const store = this._getStore();
    store.goals = store.goals.filter(g => g.id !== goalId);
    this._write();
    return Promise.resolve();
  }

  // --- Achievements ---

  /**
   * Returns all earned achievements.
   * @returns {Promise<Array<{ code, earnedAt }>>}
   */
  async getEarnedAchievements() {
    return Promise.resolve([...this._getStore().achievements]);
  }

  /**
   * Re-evaluates all achievement rules. Persists any newly-earned achievements.
   * @returns {Promise<Array>} achievements just awarded this call
   */
  async evaluateAchievements() {
    const store       = this._getStore();
    const newlyEarned = evaluateAchievementRules(store, this._clock());
    if (newlyEarned.length > 0) this._write();
    return Promise.resolve(newlyEarned);
  }

  // --- Preferences ---

  /**
   * Returns a copy of the current preferences.
   * @returns {Promise<{ displayName, yearGroup, weeklyGoalPapers }>}
   */
  async getPreferences() {
    return Promise.resolve({ ...this._getStore().preferences });
  }

  /**
   * Merges a partial preferences object into stored preferences.
   * @param {object} partial
   * @returns {Promise<object>} updated preferences
   */
  async updatePreferences(partial) {
    const store = this._getStore();
    Object.assign(store.preferences, partial);
    this._write();
    return Promise.resolve({ ...store.preferences });
  }

  // --- Data control ---

  /**
   * Returns a deep copy of the entire store for download/export.
   * @returns {Promise<object>}
   */
  async exportAll() {
    return Promise.resolve(JSON.parse(JSON.stringify(this._getStore())));
  }

  /**
   * Replaces the entire store with imported data after schema validation.
   * @param {object} data
   * @returns {Promise<{ success: boolean, errors: string[] }>}
   */
  async importAll(data) {
    const errors = [];
    if (!data || typeof data !== 'object') {
      errors.push('Data must be a plain object');
    } else {
      if (data.schemaVersion !== SCHEMA_VERSION) errors.push(`Unsupported schema version: ${data.schemaVersion}`);
      if (!Array.isArray(data.attempts))         errors.push('"attempts" must be an array');
      if (!Array.isArray(data.goals))            errors.push('"goals" must be an array');
      if (!Array.isArray(data.achievements))     errors.push('"achievements" must be an array');
      if (!data.preferences || typeof data.preferences !== 'object') errors.push('"preferences" must be an object');
    }
    if (errors.length > 0) return Promise.resolve({ success: false, errors });
    this._store = JSON.parse(JSON.stringify(data));
    this._write();
    log('importAll: store replaced');
    return Promise.resolve({ success: true, errors: [] });
  }

  /**
   * Wipes all stored data. Irreversible.
   * @returns {Promise<void>}
   */
  async resetAll() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* storage may be disabled */ }
    this._store              = null;
    this._corruptionDetected = false;
    log('resetAll: store cleared');
    return Promise.resolve();
  }
}

// Attach metadata and helpers for UI and testing access.
ProgressStore.ACHIEVEMENT_META = ACHIEVEMENT_META;
ProgressStore._helpers         = { computeStreak, computeTopicMastery, computeTrend };

// Expose globally for plain <script> usage.
if (typeof window !== 'undefined') window.ProgressStore = ProgressStore;
