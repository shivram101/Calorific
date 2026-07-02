import { useState } from "react";

function DashboardPage() {
    const [foods, setFoods] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [name, setName] = useState("");
    const [calories, setCalories] = useState<number | "">("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    function addFood(e: any) {
        e.preventDefault();

        if (!name || !calories) return;

        const newItem = {
            id: crypto.randomUUID(),
            name,
            calories: Number(calories),
            time: new Date().toLocaleTimeString(),
            meal: "Breakfast",
        };

        setFoods([newItem, ...foods]);
        setName("");
        setCalories("");
    }

    function removeFood(id: string) {
        setFoods(foods.filter((f) => f.id !== id));
    }

    const grouped = {
        Breakfast: foods.filter((f) => f.meal === "Breakfast"),
        Lunch: foods.filter((f) => f.meal === "Lunch"),
        Dinner: foods.filter((f) => f.meal === "Dinner"),
        Snacks: foods.filter((f) => f.meal === "Snacks"),
    };

    const totalCalories = foods.reduce((sum, f) => sum + f.calories, 0);

    return (
        <div style={styles.page}>
            {/* TOP RIBBON */}
            <div style={styles.ribbon}>
                {/* LEFT SIDE */}
                <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <div style={styles.ribbonItem}>🍎 FOOD</div>
                    <div style={styles.ribbonItem}>🏃 EXERCISE</div>
                    <div style={styles.ribbonItem}>📝 NOTE</div>
                </div>

                {/* RIGHT SIDE */}
                <div style={styles.ribbonRight}>
                    {isLoggedIn && (
                        <div style={styles.userTag}>Logged In</div>
                    )}

                    {!isLoggedIn ? (
                        <button
                            style={styles.loginBtn}
                            onClick={() => setIsLoggedIn(true)}
                        >
                            Login
                        </button>
                    ) : (
                        <button
                            style={styles.logoutBtn}
                            onClick={() => setIsLoggedIn(false)}
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN CARD */}
            <div style={styles.card}>
                {/* HEADER */}
                <div style={styles.header}>
                    <h2 style={{ margin: 0 }}>Food Diary</h2>
                    <p style={{ margin: 0, color: "#8A8378" }}>
                        Total Calories: {totalCalories}
                    </p>
                </div>

                {/* SEARCH BAR */}
                <div style={styles.searchRow}>
                    <input
                        placeholder="Search all foods & recipes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={styles.search}
                    />
                    <button style={styles.searchBtn}>SEARCH</button>
                </div>

                {/* FILTER TABS */}
                <div style={styles.tabs}>
                    <span style={styles.tabActive}>All</span>
                    <span style={styles.tab}>Favorites</span>
                    <span style={styles.tab}>Common Foods</span>
                    <span style={styles.tab}>Beverages</span>
                    <span style={styles.tab}>Supplements</span>
                    <span style={styles.tab}>Brands</span>
                    <span style={styles.tab}>Custom</span>
                </div>

                {/* ADD FOOD FORM */}
                <form onSubmit={addFood} style={styles.addRow}>
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
                        onChange={(e) =>
                            setCalories(e.target.value ? Number(e.target.value) : "")
                        }
                        style={styles.input}
                    />
                    <button style={styles.addBtn}>Add</button>
                </form>

                {/* DIARY SECTIONS */}
                {Object.entries(grouped).map(([meal, items]: any) => (
                    <div key={meal} style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <strong>{meal}</strong>
                            <span style={{ color: "#8A8378" }}>
                                {items.reduce((s: number, i: any) => s + i.calories, 0)} kcal
                            </span>
                        </div>

                        {items.length === 0 ? (
                            <div style={styles.empty}>No entries</div>
                        ) : (
                            items.map((item: any) => (
                                <div key={item.id} style={styles.row}>
                                    <div>
                                        <div style={styles.foodName}>{item.name}</div>
                                        <div style={styles.meta}>
                                            {item.time} • {item.calories} kcal
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => removeFood(item.id)}
                                        style={styles.delete}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ))}
            </div>
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
    },

    ribbon: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#ffffff",
        padding: "12px 18px",
        borderRadius: 12,
        boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
        marginBottom: 15,
    },

    ribbonItem: {
        fontSize: 13,
        fontWeight: 600,
        color: "#2D2A26",
        cursor: "pointer",
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

    card: {
        background: "#fff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 10px 28px rgba(0,0,0,0.07)",
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

    tabs: {
        display: "flex",
        gap: 12,
        fontSize: 12,
        color: "#8A8378",
        marginBottom: 20,
        flexWrap: "wrap",
    },

    tab: {
        cursor: "pointer",
    },

    tabActive: {
        fontWeight: 700,
        color: "#2D2A26",
        borderBottom: "2px solid #1FA873",
    },

    addRow: {
        display: "flex",
        gap: 10,
        marginBottom: 20,
    },

    input: {
        flex: 1,
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
        padding: 10,
        borderBottom: "1px solid #eee",
    },

    foodName: {
        fontWeight: 600,
    },

    meta: {
        fontSize: 12,
        color: "#8A8378",
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
};