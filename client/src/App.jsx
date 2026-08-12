import {
    BrowserRouter,
    Routes,
    Route,
    Link,
    useLocation,
    useNavigate
} from "react-router-dom";

import { useEffect, useState } from "react";

import api from "./services/api";

import Purchases from "./pages/Purchases";
import Transfers from "./pages/Transfers";
import AssignmentsExpenditures from "./pages/AssignmentsExpenditures";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";


// =====================================================
// DASHBOARD
// =====================================================

function Dashboard() {

    const [breakdown, setBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    const fetchDashboard = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get(
                "/dashboard/breakdown"
            );

            if (response.data.success) {

                setBreakdown(
                    response.data.breakdown || []
                );

            } else {

                setError(
                    response.data.message ||
                    "Failed to load dashboard"
                );

            }

        } catch (err) {

            console.error(
                "Dashboard error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to connect to backend"
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        fetchDashboard();

    }, []);


    if (loading) {

        return (
            <div className="dashboard-page">

                <h1>
                    Military Asset Management
                </h1>

                <p>
                    Loading dashboard...
                </p>

            </div>
        );

    }


    if (error) {

        return (
            <div className="dashboard-page">

                <h1>
                    Military Asset Management
                </h1>

                <div className="error-message">
                    {error}
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchDashboard}
                >
                    Try Again
                </button>

            </div>
        );

    }


    return (
        <div className="dashboard-page">

            <header className="dashboard-header">

                <div>

                    <h1>
                        Military Asset Management
                    </h1>

                    <p>
                        Asset inventory and stock movement dashboard
                    </p>

                </div>

                <button
                    className="refresh-button"
                    onClick={fetchDashboard}
                >
                    Refresh
                </button>

            </header>


            {breakdown.length === 0 ? (

                <div className="no-data">
                    No dashboard data available.
                </div>

            ) : (

                breakdown.map((item) => (

                    <section
                        className="base-section"
                        key={`${item.base_id}-${item.equipment_type_id}`}
                    >

                        <div className="base-header">

                            <div>

                                <h2>
                                    {item.base_name}
                                </h2>

                                <p>
                                    Equipment Type:{" "}

                                    <strong>
                                        {item.equipment_type_name}
                                    </strong>
                                </p>

                            </div>

                        </div>


                        <div className="dashboard-grid">

                            <div className="dashboard-card">

                                <h3>
                                    Opening Balance
                                </h3>

                                <p>
                                    {item.opening_balance}
                                </p>

                            </div>


                            <div className="dashboard-card">

                                <h3>
                                    Purchases
                                </h3>

                                <p>
                                    {item.purchases}
                                </p>

                            </div>


                            <div className="dashboard-card">

                                <h3>
                                    Transfer In
                                </h3>

                                <p>
                                    {item.transfer_in}
                                </p>

                            </div>


                            <div className="dashboard-card">

                                <h3>
                                    Transfer Out
                                </h3>

                                <p>
                                    {item.transfer_out}
                                </p>

                            </div>


                            <div className="dashboard-card">

                                <h3>
                                    Assigned
                                </h3>

                                <p>
                                    {item.assigned}
                                </p>

                            </div>


                            <div className="dashboard-card">

                                <h3>
                                    Expended
                                </h3>

                                <p>
                                    {item.expended}
                                </p>

                            </div>


                            <div className="dashboard-card closing-card">

                                <h3>
                                    Closing Balance
                                </h3>

                                <p>
                                    {item.closing_balance}
                                </p>

                            </div>


                            <div className="dashboard-card asset-card">

                                <h3>
                                    Current Assets
                                </h3>

                                <p>
                                    {item.current_asset_quantity}
                                </p>

                            </div>

                        </div>


                        <div className="movement-section">

                            <h3>
                                Stock Movement
                            </h3>

                            <div className="movement">

                                <span>
                                    Opening:{" "}
                                    <strong>
                                        {item.opening_balance}
                                    </strong>
                                </span>

                                <span>+</span>

                                <span>
                                    Purchases:{" "}
                                    <strong>
                                        {item.purchases}
                                    </strong>
                                </span>

                                <span>+</span>

                                <span>
                                    Transfer In:{" "}
                                    <strong>
                                        {item.transfer_in}
                                    </strong>
                                </span>

                                <span>-</span>

                                <span>
                                    Transfer Out:{" "}
                                    <strong>
                                        {item.transfer_out}
                                    </strong>
                                </span>

                                <span>-</span>

                                <span>
                                    Assigned:{" "}
                                    <strong>
                                        {item.assigned}
                                    </strong>
                                </span>

                                <span>-</span>

                                <span>
                                    Expended:{" "}
                                    <strong>
                                        {item.expended}
                                    </strong>
                                </span>

                                <span>=</span>

                                <span className="closing-value">

                                    Closing:{" "}

                                    <strong>
                                        {item.closing_balance}
                                    </strong>

                                </span>

                            </div>

                        </div>

                    </section>

                ))

            )}

        </div>
    );

}


// =====================================================
// NAVIGATION
// =====================================================

function Navigation() {

    const location = useLocation();
    const navigate = useNavigate();

    const [loggedIn, setLoggedIn] = useState(
        Boolean(localStorage.getItem("token"))
    );


    useEffect(() => {

        setLoggedIn(
            Boolean(localStorage.getItem("token"))
        );

    }, [location.pathname]);


    // IMPORTANT:
    // Don't show navigation on login page
    // or when there is no token.

    if (
        location.pathname === "/login" ||
        !loggedIn
    ) {

        return null;

    }


    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setLoggedIn(false);

        navigate("/login");

    };


    return (

        <nav className="main-navigation">

            <div className="nav-brand">
                Military Asset Management
            </div>


            <div className="nav-links">

                <Link to="/">
                    Dashboard
                </Link>

                <Link to="/purchases">
                    Purchases
                </Link>

                <Link to="/transfers">
                    Transfers
                </Link>

                <Link to="/assignments-expenditures">
                    Assignments & Expenditures
                </Link>

                <button
                    type="button"
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>

        </nav>

    );

}


// =====================================================
// APP
// =====================================================

function App() {

    return (

        <BrowserRouter>

            <Navigation />

            <Routes>


                {/* LOGIN */}

                <Route
                    path="/login"
                    element={
                        <Login />
                    }
                />


                {/* DASHBOARD */}

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />


                {/* PURCHASES */}

                <Route
                    path="/purchases"
                    element={
                        <ProtectedRoute>
                            <Purchases />
                        </ProtectedRoute>
                    }
                />


                {/* TRANSFERS */}

                <Route
                    path="/transfers"
                    element={
                        <ProtectedRoute>
                            <Transfers />
                        </ProtectedRoute>
                    }
                />


                {/* ASSIGNMENTS & EXPENDITURES */}

                <Route
                    path="/assignments-expenditures"
                    element={
                        <ProtectedRoute>
                            <AssignmentsExpenditures />
                        </ProtectedRoute>
                    }
                />


                {/* UNKNOWN URL */}

                <Route
                    path="*"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>

    );

}


export default App;