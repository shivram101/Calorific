import { useState } from "react";

type Meal = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

interface FoodItem {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    time: string;
    meal: Meal;
    favorite: boolean;
}

/* ================= MOCK DATA =================*/
const MOCK_FOODS: FoodItem[] = [
    { id: "1", name: "Oatmeal", calories: 300, protein: 10, carbs: 54, fat: 6, time: "8:12 AM", meal: "Breakfast", favorite: true },
    { id: "2", name: "Banana", calories: 120, protein: 1, carbs: 31, fat: 0, time: "8:14 AM", meal: "Breakfast", favorite: false },
    { id: "3", name: "Chicken salad", calories: 560, protein: 42, carbs: 18, fat: 34, time: "12:40 PM", meal: "Lunch", favorite: false },
    { id: "4", name: "Greek yogurt", calories: 150, protein: 15, carbs: 9, fat: 6, time: "3:05 PM", meal: "Snacks", favorite: true },
];

const GOALS = { calories: 2727, protein: 273, carbs: 136, fat: 121 };

const MEALS: Meal[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];

function DashboardPage() {
    const [foods, setFoods] = useState<FoodItem[]>(MOCK_FOODS);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"All" | "Favorites">("All");

    const [name, setName] = useState("");
    const [calories, setCalories] = useState<number | "">("");
    const [protein, setProtein] = useState<number | "">("");
    const [carbs, setCarbs] = useState<number | "">("");
    const [fat, setFat] = useState<number | "">("");
    const [meal, setMeal] = useState<Meal>("Breakfast");

    const [isLoggedIn, setIsLoggedIn] = useState(true);

    function addFood(e: any) {
        e.preventDefault();
        if (!name || !calories) return;

        const newItem: FoodItem = {
            id: crypto.randomUUID(),
            name,
            calories: Number(calories),
            protein: Number(protein) || 0,
            carbs: Number(carbs) || 0,
            fat: Number(fat) || 0,
            time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            meal,
            favorite: false,
        };

        setFoods([newItem, ...foods]);
        setName("");
        setCalories("");
        setProtein("");
        setCarbs("");
        setFat("");
    }

    function removeFood(id: string) {
        setFoods(foods.filter((f) => f.id !== id));
    }

    function toggleFavorite(id: string) {
        setFoods(foods.map((f) => (f.id === id ? { ...f, favorite: !f.favorite } : f)));
    }

    const visibleFoods =
        activeTab === "Favorites" ? foods.filter((f) => f.favorite) : foods;

    const grouped: Record<Meal, FoodItem[]> = {
        Breakfast: visibleFoods.filter((f) => f.meal === "Breakfast"),
        Lunch: visibleFoods.filter((f) => f.meal === "Lunch"),
        Dinner: visibleFoods.filter((f) => f.meal === "Dinner"),
        Snacks: visibleFoods.filter((f) => f.meal === "Snacks"),
    };

    const totals = foods.reduce(
        (acc, f) => ({
            calories: acc.calories + f.calories,
            protein: acc.protein + f.protein,
            carbs: acc.carbs + f.carbs,
            fat: acc.fat + f.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const today = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    return (
        <div style={styles.page}>
            {/* TOP RIBBON */}
            <div style={styles.ribbon}>
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <div style={styles.brand}>Calorific</div>
                    <div style={styles.ribbonItem}>Log</div>
                    <div style={styles.ribbonItemMuted}>Goals</div>
                    <div style={styles.ribbonItemMuted}>Settings</div>
                </div>

                <div style={styles.ribbonRight}>
                    {isLoggedIn && <div style={styles.userTag}>Logged in</div>}
                    {!isLoggedIn ? (
                        <button style={styles.loginBtn} onClick={() => setIsLoggedIn(true)}>
                            Login
                        </button>
                    ) : (
                        <button style={styles.logoutBtn} onClick={() => setIsLoggedIn(false)}>
                            Logout
                        </button>
                    )}
                </div>
            </div>

            {/* LOG FOOD + TODAY SUMMARY */}
            <div style={styles.topGrid}>
                {/* LOG FOOD CARD */}
                <div style={styles.card}>
                    <div style={styles.header}>
                        <h2 style={{ margin: 0, fontSize: 18 }}>Log food</h2>
                    </div>

                    <div style={styles.searchRow}>
                        <input
                            placeholder="Search all foods & recipes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={styles.search}
                        />
                        <button style={styles.searchBtn}>Search</button>
                    </div>

                    <div style={styles.tabs}>
                        <span
                            style={activeTab === "All" ? styles.tabActive : styles.tab}
                            onClick={() => setActiveTab("All")}
                        >
                            All
                        </span>
                        <span
                            style={activeTab === "Favorites" ? styles.tabActive : styles.tab}
                            onClick={() => setActiveTab("Favorites")}
                        >
                            Favorites
                        </span>
                        <span style={styles.tabDisabled}>Common foods</span>
                        <span style={styles.tabDisabled}>Beverages</span>
                        <span style={styles.tabDisabled}>Supplements</span>
                        <span style={styles.tabDisabled}>Brands</span>
                        <span style={styles.tabDisabled}>Custom</span>
                    </div>

                    {search ? (
                        <div style={styles.searchNotice}>
                            Search results will appear here once the food database is connected.
                        </div>
                    ) : null}

                    <form onSubmit={addFood} style={styles.addForm}>
                        <div style={styles.addRow}>
                            <input
                                placeholder="Food name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={styles.input}
                            />
                            <input
                                placeholder="Calories"
                                type="number"
                                value={calories}
                                onChange={(e) => setCalories(e.target.value ? Number(e.target.value) : "")}
                                style={{ ...styles.input, maxWidth: 100 }}
                            />
                        </div>
                        <div style={styles.addRow}>
                            <input
                                placeholder="Protein (g)"
                                type="number"
                                value={protein}
                                onChange={(e) => setProtein(e.target.value ? Number(e.target.value) : "")}
                                style={styles.input}
                            />
                            <input
                                placeholder="Carbs (g)"
                                type="number"
                                value={carbs}
                                onChange={(e) => setCarbs(e.target.value ? Number(e.target.value) : "")}
                                style={styles.input}
                            />
                            <input
                                placeholder="Fat (g)"
                                type="number"
                                value={fat}
                                onChange={(e) => setFat(e.target.value ? Number(e.target.value) : "")}
                                style={styles.input}
                            />
                            <select
                                value={meal}
                                onChange={(e) => setMeal(e.target.value as Meal)}
                                style={styles.select}
                            >
                                {MEALS.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                            <button style={styles.addBtn}>Add</button>
                        </div>
                    </form>
                </div>

                {/* TODAY SUMMARY CARD */}
                <div style={styles.summaryCol}>
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryEyebrow}>Today</div>
                        <div style={styles.summaryDate}>{today}</div>
                        <div style={styles.summaryCalLabel}>Calories</div>
                        <div style={styles.summaryCalValue}>{totals.calories.toLocaleString()}</div>
                    </div>

                    <div style={styles.macroCard}>
                        <div style={styles.macroItem}>
                            <div style={{ ...styles.macroValue, color: "#378ADD" }}>{totals.fat}g</div>
                            <div style={styles.macroLabel}>Fat</div>
                        </div>
                        <div style={styles.macroItem}>
                            <div style={{ ...styles.macroValue, color: "#DC4C3F" }}>{totals.protein}g</div>
                            <div style={styles.macroLabel}>Protein</div>
                        </div>
                        <div style={styles.macroItem}>
                            <div style={{ ...styles.macroValue, color: "#EF9F27" }}>{totals.carbs}g</div>
                            <div style={styles.macroLabel}>Carbs</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOD DIARY */}
            <div style={styles.card}>
                <div style={styles.header}>
                    <h2 style={{ margin: 0, fontSize: 18 }}>Food diary</h2>
                    <p style={{ margin: 0, color: "#8A8378" }}>Total calories: {totals.calories}</p>
                </div>

                {MEALS.map((m) => {
                    const items = grouped[m];
                    const mealCalories = items.reduce((s, i) => s + i.calories, 0);

                    return (
                        <div key={m} style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <strong>{m}</strong>
                                <span style={{ color: "#8A8378" }}>{mealCalories} kcal</span>
                            </div>

                            {items.length === 0 ? (
                                <div style={styles.empty}>No entries</div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id} style={styles.row}>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                                            <button
                                                onClick={() => toggleFavorite(item.id)}
                                                style={styles.star}
                                                aria-label={item.favorite ? "Remove favorite" : "Add favorite"}
                                            >
                                                {item.favorite ? "★" : "☆"}
                                            </button>
                                            <div>
                                                <div style={styles.foodName}>{item.name}</div>
                                                <div style={styles.meta}>{item.time}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                            <span style={styles.metaBold}>{item.calories} kcal</span>
                                            <span style={{ ...styles.macroTag, color: "#DC4C3F" }}>{item.protein}g P</span>
                                            <span style={{ ...styles.macroTag, color: "#EF9F27" }}>{item.carbs}g C</span>
                                            <span style={{ ...styles.macroTag, color: "#378ADD" }}>{item.fat}g F</span>
                                            <button onClick={() => removeFood(item.id)} style={styles.delete}>
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    );
                })}
            </div>

            {/* GOALS — moved to the bottom */}
            <div style={styles.card}>
                <div style={styles.header}>
                    <h2 style={{ margin: 0, fontSize: 18 }}>Goals</h2>
                </div>
                <div style={styles.ringsRow}>
                    <ProgressRing value={totals.calories} max={GOALS.calories} color="#1FA873" label="Calories" unit="kcal" />
                    <ProgressRing value={totals.protein} max={GOALS.protein} color="#DC4C3F" label="Protein" unit="g" />
                    <ProgressRing value={totals.carbs} max={GOALS.carbs} color="#EF9F27" label="Carbs" unit="g" />
                    <ProgressRing value={totals.fat} max={GOALS.fat} color="#378ADD" label="Fat" unit="g" />
                </div>
            </div>
        </div>
    );
}

/* ================= PROGRESS RING ================= */

function ProgressRing({
    value,
    max,
    color,
    label,
    unit,
}: {
    value: number;
    max: number;
    color: string;
    label: string;
    unit: string;
}) {
    const size = 96;
    const stroke = 9;
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const pct = max > 0 ? Math.min(value / max, 1) : 0;
    const offset = circumference - pct * circumference;

    return (
        <div style={styles.ringWrap}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                    stroke="#EEEEEE"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={offset}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.4s" }}
                />
                <text x="50%" y="46%" textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: "#2D2A26" }}>
                    {value}
                </text>
                <text x="50%" y="63%" textAnchor="middle" style={{ fontSize: 10, fill: "#8A8378" }}>
                    / {max}{unit}
                </text>
            </svg>
            <div style={styles.ringLabel}>{label}</div>
        </div>
    );
}

export default DashboardPage;

/* ================= UI THEME ================= */

const styles: any = {
    page: {
        minHeight: "100vh",
        background: "#FFF8ED",
        padding: 20,
        fontFamily: "Arial",
        display: "flex",
        flexDirection: "column",
        gap: 15,
    },

    ribbon: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#ffffff",
        padding: "12px 18px",
        borderRadius: 12,
        boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
    },

    brand: {
        fontWeight: 700,
        fontSize: 15,
        color: "#2D2A26",
    },

    ribbonItem: {
        fontSize: 13,
        fontWeight: 600,
        color: "#2D2A26",
        cursor: "pointer",
        borderBottom: "2px solid #1FA873",
        paddingBottom: 2,
    },

    ribbonItemMuted: {
        fontSize: 13,
        fontWeight: 600,
        color: "#C7C2B8",
        cursor: "default",
    },

    ribbonRight: {
        display: "flex",
        alignItems: "center",
        gap: 10,
    },

    userTag: {
        fontSize: 12,
        color: "#2D2A26",
        background: "#FFF8ED",
        padding: "6px 10px",
        borderRadius: 10,
    },

    loginBtn: {
        background: "#1FA873",
        color: "#fff",
        border: "none",
        padding: "6px 12px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 600,
    },

    logoutBtn: {
        background: "#DC4C3F",
        color: "#fff",
        border: "none",
        padding: "6px 12px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 600,
    },

    topGrid: {
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 15,
        alignItems: "start",
    },

    card: {
        background: "#fff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 10px 28px rgba(0,0,0,0.07)",
    },

    summaryCol: {
        display: "flex",
        flexDirection: "column",
        gap: 15,
    },

    summaryCard: {
        background: "#fff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 10px 28px rgba(0,0,0,0.07)",
    },

    summaryEyebrow: {
        fontSize: 11,
        fontWeight: 700,
        color: "#1FA873",
        letterSpacing: 0.5,
    },

    summaryDate: {
        fontSize: 13,
        fontWeight: 600,
        color: "#2D2A26",
        marginBottom: 12,
    },

    summaryCalLabel: {
        fontSize: 11,
        color: "#8A8378",
        textAlign: "right",
    },

    summaryCalValue: {
        fontSize: 28,
        fontWeight: 700,
        color: "#2D2A26",
        textAlign: "right",
    },

    macroCard: {
        background: "#fff",
        borderRadius: 16,
        padding: "16px 20px",
        boxShadow: "0 10px 28px rgba(0,0,0,0.07)",
        display: "flex",
        justifyContent: "space-between",
    },

    macroItem: {
        textAlign: "center",
    },

    macroValue: {
        fontSize: 18,
        fontWeight: 700,
    },

    macroLabel: {
        fontSize: 11,
        color: "#8A8378",
        marginTop: 2,
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 15,
    },

    searchRow: {
        display: "flex",
        gap: 10,
        marginBottom: 10,
    },

    search: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        background: "#FFF8ED",
        border: "1px solid transparent",
    },

    searchBtn: {
        padding: "10px 14px",
        background: "#1FA873",
        color: "#fff",
        borderRadius: 10,
        border: "none",
        fontWeight: 600,
    },

    searchNotice: {
        fontSize: 12,
        fontStyle: "italic",
        color: "#aaa",
        marginBottom: 15,
    },

    tabs: {
        display: "flex",
        gap: 12,
        fontSize: 12,
        color: "#8A8378",
        marginBottom: 15,
        flexWrap: "wrap",
    },

    tab: {
        cursor: "pointer",
    },

    tabDisabled: {
        cursor: "default",
        color: "#D8D4C9",
    },

    tabActive: {
        fontWeight: 700,
        color: "#2D2A26",
        borderBottom: "2px solid #1FA873",
        cursor: "pointer",
    },

    addForm: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },

    addRow: {
        display: "flex",
        gap: 10,
    },

    input: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        background: "#FFF8ED",
        border: "none",
    },

    select: {
        padding: 10,
        borderRadius: 10,
        background: "#FFF8ED",
        border: "none",
    },

    addBtn: {
        background: "#1FA873",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: "10px 14px",
        fontWeight: 600,
        whiteSpace: "nowrap",
    },

    section: {
        marginBottom: 15,
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        background: "#F3F6FF",
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },

    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        borderBottom: "1px solid #eee",
    },

    star: {
        border: "none",
        background: "transparent",
        color: "#1FA873",
        fontSize: 16,
        cursor: "pointer",
        lineHeight: 1,
        padding: 0,
        marginTop: 2,
    },

    foodName: {
        fontWeight: 600,
    },

    meta: {
        fontSize: 12,
        color: "#8A8378",
    },

    metaBold: {
        fontSize: 13,
        fontWeight: 700,
        color: "#2D2A26",
        minWidth: 70,
        textAlign: "right",
    },

    macroTag: {
        fontSize: 12,
        fontWeight: 600,
    },

    delete: {
        border: "none",
        background: "transparent",
        color: "#DC4C3F",
        fontSize: 16,
        cursor: "pointer",
    },

    empty: {
        fontSize: 12,
        color: "#aaa",
        padding: 10,
    },

    ringsRow: {
        display: "flex",
        justifyContent: "space-around",
        flexWrap: "wrap",
        gap: 20,
    },

    ringWrap: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
    },

    ringLabel: {
        fontSize: 12,
        fontWeight: 600,
        color: "#2D2A26",
    },
};
