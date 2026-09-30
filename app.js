/**
 * Nook — Minimalist Habit Tracker
 * Author: Velihovetchi Bogdan
 */

// LocalStorage Keys
const STORAGE_KEY_HABITS = 'nook_habits_data';
const STORAGE_KEY_DATE = 'nook_last_tracked_date';
const STORAGE_KEY_FILTER = 'nook_active_filter';
const STORAGE_KEY_DRAFT = 'nook_input_draft';
const STORAGE_KEY_OVERALL_STREAK = 'nook_overall_streak';
const STORAGE_KEY_LAST_FULL_DAY = 'nook_last_full_day';
const STORAGE_KEY_FULL_DAYS = 'nook_full_days';

// Default habits for the very first launch (clean initial state)
const DEFAULT_HABITS = [
    { id: '1', name: 'Drink a glass of water in the morning', completed: false, streak: 0, completedDates: [], lastCompletedDate: null, createdAt: new Date().toISOString() },
    { id: '2', name: 'Read a book for 15 minutes', completed: false, streak: 0, completedDates: [], lastCompletedDate: null, createdAt: new Date().toISOString() },
    { id: '3', name: 'Take a walk outside', completed: false, streak: 0, completedDates: [], lastCompletedDate: null, createdAt: new Date().toISOString() }
];

// Curated Habit Sets for Different Lifestyles
const HABIT_PACKS = [
    {
        id: 'dev',
        name: 'Programming',
        habits: [
            'Read docs or work on a side project for 30 mins',
            'Stretch eyes and neck every 2 hours',
            'Make a meaningful commit and push code',
            'Drink a glass of water between meetings',
            'Close unused tabs and organize workspace'
        ]
    },
    {
        id: 'sport',
        name: 'Health & Fitness',
        habits: [
            'Morning warmup or stretching for 15 mins',
            'Drink 2 liters of water throughout the day',
            'Complete workout or run',
            'Walk 10,000 steps outdoors',
            '8 hours of sleep (go to bed before 11:00 PM)'
        ]
    },
    {
        id: 'study',
        name: 'Learning',
        habits: [
            '25-minute focused study session (Pomodoro)',
            'Read a topic-related book for 20 mins',
            'Review 10 new vocabulary words',
            'Write down key takeaways of the day',
            'Set top 3 priorities for tomorrow'
        ]
    },
    {
        id: 'balance',
        name: 'Mindfulness & Rest',
        habits: [
            '10 minutes of morning silence or meditation',
            'Walk outside without headphones',
            'Eat fresh fruits or greens with lunch',
            'Write down 3 things you are grateful for',
            'Digital detox 1 hour before sleep'
        ]
    },
    {
        id: 'creator',
        name: 'Creativity',
        habits: [
            'Quick sketch or outline of a new idea',
            'Analyze 3 inspiring references or artworks',
            '1 hour of practice on a creative project',
            'Jot down an insightful thought in a journal'
        ]
    }
];

// Helper: Format Date object to YYYY-MM-DD string
function formatDateString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Return formatted today date string: YYYY-MM-DD
function getTodayDateString() {
    return formatDateString(new Date());
}

// Return formatted yesterday date string: YYYY-MM-DD
function getYesterdayDateString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatDateString(d);
}

// Return date string 1 day before a given YYYY-MM-DD string
function getPreviousDateString(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0); // Noon eliminates any DST boundary shifts
    date.setDate(date.getDate() - 1);
    return formatDateString(date);
}

// Robust, deterministic streak calculation from an array of completed YYYY-MM-DD strings
function calculateStreak(completedDates) {
    if (!completedDates || completedDates.length === 0) return 0;
    const dateSet = new Set(completedDates);
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    let streak = 0;
    let checkDate;

    if (dateSet.has(today)) {
        streak = 1;
        checkDate = yesterday;
    } else if (dateSet.has(yesterday)) {
        // Active streak continuing from yesterday, awaiting today's completion
        streak = 1;
        checkDate = getPreviousDateString(yesterday);
    } else {
        // Neither today nor yesterday was completed -> streak broken
        return 0;
    }

    while (dateSet.has(checkDate)) {
        streak++;
        checkDate = getPreviousDateString(checkDate);
    }

    return streak;
}

// Pluralization helper for streaks (1 day, 2 days)
function getDaysPlural(n) {
    return Math.abs(n) === 1 ? 'day' : 'days';
}

// Full Days Storage (dates when all habits were 100% completed)
function loadFullDays() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_FULL_DAYS);
        if (stored !== null) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.error('Failed to parse fullDays from localStorage', e);
    }

    // Migration from old storage if exists
    const oldStreak = parseInt(localStorage.getItem(STORAGE_KEY_OVERALL_STREAK), 10) || 0;
    const oldLastFullDay = localStorage.getItem(STORAGE_KEY_LAST_FULL_DAY);
    if (oldStreak > 0 && oldLastFullDay) {
        const migrated = [];
        let curr = oldLastFullDay;
        for (let i = 0; i < oldStreak; i++) {
            migrated.push(curr);
            curr = getPreviousDateString(curr);
        }
        migrated.sort();
        saveFullDays(migrated);
        return migrated;
    }

    return [];
}

function saveFullDays(data) {
    try {
        localStorage.setItem(STORAGE_KEY_FULL_DAYS, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save fullDays to localStorage', e);
    }
}

// App State
let fullDays = loadFullDays();
let habits = loadHabits();
let currentFilter = loadFilter();
let overallStreak = calculateStreak(fullDays);
let midnightTimer = null;
let currentPackId = 'dev';
let selectedPackHabits = new Set();

// DOM Elements
const habitForm = document.getElementById('habit-form');
const habitInput = document.getElementById('habit-input');
const habitList = document.getElementById('habit-list');
const emptyState = document.getElementById('empty-state');
const progressStats = document.getElementById('progress-stats');
const progressPercentage = document.getElementById('progress-percentage');
const progressBar = document.getElementById('progress-bar');
const currentDateEl = document.getElementById('current-date');
const filterBtns = document.querySelectorAll('.filter-btn');
const overallStreakEl = document.getElementById('overall-streak');
const overallStreakCountEl = document.getElementById('overall-streak-count');

// Packs Modal DOM Elements
const openPacksBtn = document.getElementById('open-packs-btn');
const closePacksBtn = document.getElementById('close-packs-btn');
const packsModal = document.getElementById('packs-modal');
const packsTabs = document.getElementById('packs-tabs');
const packsBody = document.getElementById('packs-body');
const btnToggleAllPack = document.getElementById('btn-toggle-all-pack');
const btnAddSelectedPack = document.getElementById('btn-add-selected-pack');
const packCountBadge = document.getElementById('pack-count-badge');

// License Modal DOM Elements
const footerLicenseBtn = document.getElementById('footer-license-btn');
const licenseModal = document.getElementById('license-modal');
const closeLicenseBtn = document.getElementById('close-license-btn');

// Initialize Application
function init() {
    // 1. Check if a new day has arrived and handle daily reset of habits and streaks
    checkAndResetDailyHabits();

    // 2. Restore saved UI state (input draft, filter)
    restoreSavedState();

    // 3. Render current date, overall streak, and habits list
    displayCurrentDate();
    evaluateOverallStreak();
    setupEventListeners();
    render();

    // 4. Schedule automatic reset at next 00:00 midnight
    scheduleMidnightReset();
}

// Check if midnight passed and reset habits completion & manage streaks
function checkAndResetDailyHabits() {
    const today = getTodayDateString();

    fullDays = loadFullDays();

    // Recalculate daily completion and streaks for all habits based on dates
    habits = habits.map(habit => {
        const completedDates = habit.completedDates || [];
        const isCompletedToday = completedDates.includes(today);
        const streak = calculateStreak(completedDates);
        return {
            ...habit,
            completed: isCompletedToday,
            streak: streak
        };
    });
    saveHabits();

    overallStreak = calculateStreak(fullDays);
    localStorage.setItem(STORAGE_KEY_OVERALL_STREAK, overallStreak.toString());

    // Always update last recorded date to today
    localStorage.setItem(STORAGE_KEY_DATE, today);
}

// Schedule midnight reset timer (fires automatically at 00:00:01)
function scheduleMidnightReset() {
    if (midnightTimer) {
        clearTimeout(midnightTimer);
    }

    const now = new Date();
    const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0, 0, 1
    );

    const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());

    midnightTimer = setTimeout(() => {
        checkAndResetDailyHabits();
        displayCurrentDate();
        evaluateOverallStreak();
        render();
        scheduleMidnightReset();
    }, msUntilMidnight);
}

// Display localized current date (e.g., "Wednesday, September 30")
function displayCurrentDate() {
    if (!currentDateEl) return;
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const formatted = now.toLocaleDateString('en-US', options);
    currentDateEl.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

// Update overall streak header badge
function updateOverallStreakDisplay() {
    const today = getTodayDateString();
    const isCompletedToday = fullDays && fullDays.includes(today);

    if (overallStreakCountEl) {
        overallStreakCountEl.textContent = overallStreak;
    }
    if (overallStreakEl) {
        if (overallStreak > 0) {
            overallStreakEl.classList.add('active');
            if (isCompletedToday) {
                overallStreakEl.title = `Total streak: ${overallStreak} ${getDaysPlural(overallStreak)} in a row (all habits completed today!)`;
            } else {
                overallStreakEl.title = `Total streak: ${overallStreak} ${getDaysPlural(overallStreak)} in a row (complete today's habits to continue!)`;
            }
        } else {
            overallStreakEl.classList.remove('active');
            overallStreakEl.title = 'Complete all daily habits to start a streak!';
        }
    }
}

// Check and update overall streak when habits progress reaches 100%
function evaluateOverallStreak() {
    const today = getTodayDateString();
    const fullDaysSet = new Set(loadFullDays());

    const total = habits.length;
    const completed = habits.filter(h => h.completed).length;
    const isAllCompleted = total > 0 && completed === total;

    if (isAllCompleted) {
        fullDaysSet.add(today);
    } else {
        fullDaysSet.delete(today);
    }

    fullDays = Array.from(fullDaysSet).sort();
    saveFullDays(fullDays);

    overallStreak = calculateStreak(fullDays);
    localStorage.setItem(STORAGE_KEY_OVERALL_STREAK, overallStreak.toString());

    const lastFull = fullDays.length > 0 ? fullDays[fullDays.length - 1] : null;
    if (lastFull) {
        localStorage.setItem(STORAGE_KEY_LAST_FULL_DAY, lastFull);
    } else {
        localStorage.removeItem(STORAGE_KEY_LAST_FULL_DAY);
    }

    updateOverallStreakDisplay();
}

// Restore saved input draft and filter state
function restoreSavedState() {
    const savedDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
    if (savedDraft && habitInput) {
        habitInput.value = savedDraft;
    }

    filterBtns.forEach(btn => {
        if (btn.dataset.filter === currentFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Load habits from LocalStorage (persists empty list if user intentionally deleted all)
function loadHabits() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_HABITS);
        if (stored !== null) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                const today = getTodayDateString();

                return parsed.map(habit => {
                    let completedDates = Array.isArray(habit.completedDates) 
                        ? habit.completedDates 
                        : null;

                    // Migrate old habit without completedDates
                    if (!completedDates) {
                        completedDates = [];
                        if (habit.completed) {
                            completedDates.push(today);
                        }
                    }

                    const streak = calculateStreak(completedDates);
                    const isCompleted = completedDates.includes(today);
                    const lastDate = completedDates.length > 0 ? completedDates[completedDates.length - 1] : null;

                    return {
                        ...habit,
                        completedDates,
                        completed: isCompleted,
                        streak,
                        lastCompletedDate: lastDate
                    };
                });
            }
        }
    } catch (e) {
        console.error('Failed to parse habits from localStorage', e);
    }
    saveHabitsData(DEFAULT_HABITS);
    return DEFAULT_HABITS;
}

// Load active filter
function loadFilter() {
    const savedFilter = localStorage.getItem(STORAGE_KEY_FILTER);
    if (savedFilter && ['all', 'active', 'completed'].includes(savedFilter)) {
        return savedFilter;
    }
    return 'all';
}

// Save habits to LocalStorage
function saveHabits() {
    saveHabitsData(habits);
}

function saveHabitsData(data) {
    try {
        localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save habits to localStorage', e);
    }
}

// Add new habit
function addHabit(name) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const newHabit = {
        id: Date.now().toString(),
        name: trimmed,
        completed: false,
        streak: 0,
        completedDates: [],
        lastCompletedDate: null,
        createdAt: new Date().toISOString()
    };

    habits.unshift(newHabit);
    saveHabits();

    // Clear draft text
    localStorage.removeItem(STORAGE_KEY_DRAFT);

    evaluateOverallStreak();
    render();
}

// Toggle habit completion status and calculate habit streak
function toggleHabit(id) {
    const today = getTodayDateString();

    habits = habits.map(habit => {
        if (habit.id !== id) return habit;

        const dateSet = new Set(habit.completedDates || []);
        const willBeCompleted = !habit.completed;

        if (willBeCompleted) {
            dateSet.add(today);
        } else {
            dateSet.delete(today);
        }

        const updatedDates = Array.from(dateSet).sort();
        const streak = calculateStreak(updatedDates);
        const lastDate = updatedDates.length > 0 ? updatedDates[updatedDates.length - 1] : null;

        return {
            ...habit,
            completed: willBeCompleted,
            streak: streak,
            completedDates: updatedDates,
            lastCompletedDate: lastDate
        };
    });

    saveHabits();
    evaluateOverallStreak();
    render();
}

// Delete habit
function deleteHabit(id) {
    habits = habits.filter(habit => habit.id !== id);
    saveHabits();
    evaluateOverallStreak();
    render();
}

// Filter habits
function getFilteredHabits() {
    if (currentFilter === 'active') {
        return habits.filter(h => !h.completed);
    }
    if (currentFilter === 'completed') {
        return habits.filter(h => h.completed);
    }
    return habits;
}

// Update progress stats and progress bar
function updateProgress() {
    const total = habits.length;
    const completed = habits.filter(h => h.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    if (progressPercentage) {
        progressPercentage.textContent = `${percentage}%`;
    }

    if (progressStats) {
        progressStats.textContent = `${completed} of ${total} completed`;
    }

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
}

// Render habit list and UI states
function render() {
    const filtered = getFilteredHabits();

    habitList.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
        filtered.forEach(habit => {
            const streakCount = habit.streak || 0;
            const streakPlural = getDaysPlural(streakCount);
            let streakTitle = '';
            if (streakCount > 0) {
                if (habit.completed) {
                    streakTitle = `Streak: ${streakCount} ${streakPlural} in a row`;
                } else {
                    streakTitle = `Streak: ${streakCount} ${streakPlural} in a row (complete today to continue!)`;
                }
            } else {
                streakTitle = 'Complete today to start a streak!';
            }

            const li = document.createElement('li');
            li.className = `habit-item ${habit.completed ? 'completed' : ''}`;
            li.dataset.id = habit.id;

            li.innerHTML = `
                <div class="habit-left" role="button" tabindex="0" aria-label="Toggle ${escapeHtml(habit.name)}">
                    <div class="custom-checkbox">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <span class="habit-title">${escapeHtml(habit.name)}</span>
                    <span class="habit-streak ${streakCount > 0 ? 'active' : ''}" title="${streakTitle}">
                        <svg class="streak-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
                        </svg>
                        <span class="streak-num">${streakCount}</span>
                    </span>
                </div>
                <button class="btn-delete" title="Delete habit" aria-label="Delete habit ${escapeHtml(habit.name)}">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            `;

            habitList.appendChild(li);
        });
    }

    updateProgress();
    updateOverallStreakDisplay();
}

// Helper to escape HTML characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================================================
// Habit Packs Logic
// ==========================================================================

function openPacksModal() {
    if (!packsModal) return;
    packsModal.style.display = 'flex';
    void packsModal.offsetWidth; // Force reflow
    packsModal.classList.add('open');
    packsModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    renderPacksTabs();
    selectPackCategory(currentPackId);
}

function closePacksModal() {
    if (!packsModal) return;
    packsModal.classList.remove('open');
    packsModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
        if (!packsModal.classList.contains('open')) {
            packsModal.style.display = 'none';
        }
    }, 220);
}

function renderPacksTabs() {
    if (!packsTabs) return;
    packsTabs.innerHTML = '';

    HABIT_PACKS.forEach(pack => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `pack-tab-btn ${pack.id === currentPackId ? 'active' : ''}`;
        btn.dataset.packId = pack.id;
        btn.textContent = pack.name;
        btn.addEventListener('click', () => {
            selectPackCategory(pack.id);
        });
        packsTabs.appendChild(btn);
    });
}

function selectPackCategory(packId) {
    currentPackId = packId;
    const pack = HABIT_PACKS.find(p => p.id === packId) || HABIT_PACKS[0];

    const tabBtns = packsTabs.querySelectorAll('.pack-tab-btn');
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.packId === packId);
    });

    selectedPackHabits.clear();
    const existingNames = new Set(habits.map(h => h.name.toLowerCase().trim()));

    pack.habits.forEach(habitText => {
        if (!existingNames.has(habitText.toLowerCase().trim())) {
            selectedPackHabits.add(habitText);
        }
    });

    renderPacksBody();
}

function renderPacksBody() {
    if (!packsBody) return;
    const pack = HABIT_PACKS.find(p => p.id === currentPackId) || HABIT_PACKS[0];
    const existingNames = new Set(habits.map(h => h.name.toLowerCase().trim()));

    packsBody.innerHTML = '';

    pack.habits.forEach(habitText => {
        const isAlreadyAdded = existingNames.has(habitText.toLowerCase().trim());
        const isSelected = selectedPackHabits.has(habitText);

        const row = document.createElement('div');
        row.className = `pack-habit-row ${isSelected ? 'selected' : ''} ${isAlreadyAdded ? 'already-added' : ''}`;
        
        row.innerHTML = `
            <div class="pack-habit-checkbox">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <span class="pack-habit-text">${escapeHtml(habitText)}</span>
            ${isAlreadyAdded ? '<span class="pack-already-badge">Already added</span>' : ''}
        `;

        if (!isAlreadyAdded) {
            row.addEventListener('click', () => {
                if (selectedPackHabits.has(habitText)) {
                    selectedPackHabits.delete(habitText);
                } else {
                    selectedPackHabits.add(habitText);
                }
                renderPacksBody();
            });
        }

        packsBody.appendChild(row);
    });

    updatePacksSelectionCount();
}

function updatePacksSelectionCount() {
    const pack = HABIT_PACKS.find(p => p.id === currentPackId) || HABIT_PACKS[0];
    const existingNames = new Set(habits.map(h => h.name.toLowerCase().trim()));
    const unaddedInPack = pack.habits.filter(h => !existingNames.has(h.toLowerCase().trim()));

    const count = selectedPackHabits.size;
    if (packCountBadge) {
        packCountBadge.textContent = count;
    }
    if (btnAddSelectedPack) {
        btnAddSelectedPack.disabled = count === 0;
    }

    if (btnToggleAllPack) {
        if (unaddedInPack.length === 0) {
            btnToggleAllPack.textContent = 'All already added';
            btnToggleAllPack.disabled = true;
        } else {
            btnToggleAllPack.disabled = false;
            if (count === unaddedInPack.length) {
                btnToggleAllPack.textContent = 'Deselect all';
            } else {
                btnToggleAllPack.textContent = 'Select all';
            }
        }
    }
}

function toggleSelectAllPack() {
    const pack = HABIT_PACKS.find(p => p.id === currentPackId) || HABIT_PACKS[0];
    const existingNames = new Set(habits.map(h => h.name.toLowerCase().trim()));
    const unaddedInPack = pack.habits.filter(h => !existingNames.has(h.toLowerCase().trim()));

    if (selectedPackHabits.size === unaddedInPack.length) {
        selectedPackHabits.clear();
    } else {
        selectedPackHabits.clear();
        unaddedInPack.forEach(h => selectedPackHabits.add(h));
    }

    renderPacksBody();
}

function addSelectedPackHabits() {
    if (selectedPackHabits.size === 0) return;

    const existingNames = new Set(habits.map(h => h.name.toLowerCase().trim()));
    let addedCount = 0;

    selectedPackHabits.forEach(habitText => {
        if (!existingNames.has(habitText.toLowerCase().trim())) {
            const newHabit = {
                id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
                name: habitText,
                completed: false,
                streak: 0,
                completedDates: [],
                lastCompletedDate: null,
                createdAt: new Date().toISOString()
            };
            habits.unshift(newHabit);
            existingNames.add(habitText.toLowerCase().trim());
            addedCount++;
        }
    });

    if (addedCount > 0) {
        saveHabits();
        evaluateOverallStreak();
        render();
    }

    closePacksModal();
}

// ==========================================================================
// License Modal Logic
// ==========================================================================

function openLicenseModal() {
    if (!licenseModal) return;
    licenseModal.style.display = 'flex';
    void licenseModal.offsetWidth; // Force reflow
    licenseModal.classList.add('open');
    licenseModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLicenseModal() {
    if (!licenseModal) return;
    licenseModal.classList.remove('open');
    licenseModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
        if (!licenseModal.classList.contains('open')) {
            licenseModal.style.display = 'none';
        }
    }, 220);
}

// Event Listeners setup
function setupEventListeners() {
    // Form submit
    habitForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const value = habitInput.value;
        if (value.trim()) {
            addHabit(value);
            habitInput.value = '';
            habitInput.focus();
        }
    });

    // Auto-save input draft on typing
    habitInput.addEventListener('input', (e) => {
        localStorage.setItem(STORAGE_KEY_DRAFT, e.target.value);
    });

    // Event delegation for habit list interactions
    habitList.addEventListener('click', (e) => {
        const item = e.target.closest('.habit-item');
        if (!item) return;

        const id = item.dataset.id;

        // Click on delete button
        if (e.target.closest('.btn-delete')) {
            deleteHabit(id);
            return;
        }

        // Click on checkbox or habit text
        if (e.target.closest('.habit-left')) {
            toggleHabit(id);
        }
    });

    // Keyboard accessibility for toggling habits
    habitList.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const habitLeft = e.target.closest('.habit-left');
            if (habitLeft) {
                e.preventDefault();
                const item = habitLeft.closest('.habit-item');
                if (item) {
                    toggleHabit(item.dataset.id);
                }
            }
        }
    });

    // Filter buttons click & persist active filter
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            localStorage.setItem(STORAGE_KEY_FILTER, currentFilter);
            render();
        });
    });

    // Habit Sets Modal interactions
    if (openPacksBtn) {
        openPacksBtn.addEventListener('click', openPacksModal);
    }
    if (closePacksBtn) {
        closePacksBtn.addEventListener('click', closePacksModal);
    }
    if (packsModal) {
        packsModal.addEventListener('click', (e) => {
            if (e.target === packsModal) {
                closePacksModal();
            }
        });
    }
    if (btnToggleAllPack) {
        btnToggleAllPack.addEventListener('click', toggleSelectAllPack);
    }
    if (btnAddSelectedPack) {
        btnAddSelectedPack.addEventListener('click', addSelectedPackHabits);
    }

    // License Modal interactions
    if (footerLicenseBtn) {
        footerLicenseBtn.addEventListener('click', openLicenseModal);
    }
    if (closeLicenseBtn) {
        closeLicenseBtn.addEventListener('click', closeLicenseModal);
    }
    if (licenseModal) {
        licenseModal.addEventListener('click', (e) => {
            if (e.target === licenseModal) {
                closeLicenseModal();
            }
        });
    }

    // Keyboard ESC to close any open modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (packsModal && packsModal.classList.contains('open')) {
                closePacksModal();
            }
            if (licenseModal && licenseModal.classList.contains('open')) {
                closeLicenseModal();
            }
        }
    });

    // Re-check date if user returns to the tab or wakes up laptop
    const handleRecheck = () => {
        const today = getTodayDateString();
        const lastDate = localStorage.getItem(STORAGE_KEY_DATE);
        if (lastDate && lastDate !== today) {
            checkAndResetDailyHabits();
            displayCurrentDate();
            evaluateOverallStreak();
            render();
            scheduleMidnightReset();
        }
    };

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) handleRecheck();
    });

    window.addEventListener('focus', handleRecheck);
}

// Start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);
