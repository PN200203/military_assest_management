import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
    const [breakdown, setBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/dashboard/breakdown");

            if (response.data.success) {
                setBreakdown(response.data.breakdown);
            } else {
                setError("Failed to load dashboard");
            }
        } catch (error) {
            console.error("Dashboard error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to load dashboard"
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
                <h1>Military Asset Dashboard</h1>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-page">
                <h1>Military Asset Dashboard</h1>

                <div className="error-message">
                    {error}
                </div>

                <button onClick={fetchDashboard}>
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard-page">

            <div className="dashboard-header">
                <div>
                    <h1>Military Asset Dashboard</h1>

                    <p>
                        Overview of military assets and stock
                        movement.
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchDashboard}
                >
                    Refresh
                </button>
            </div>

            {breakdown.map((item) => (
                <div
                    className="base-section"
                    key={item.base_id}
                >
                    <h2>{item.base_name}</h2>

                    <p className="equipment-name">
                        Equipment: {item.equipment_type_name}
                    </p>

                    <div className="dashboard-grid">

                        <div className="dashboard-card">
                            <h3>Opening Balance</h3>
                            <p>{item.opening_balance}</p>
                        </div>

                        <div className="dashboard-card">
                            <h3>Purchases</h3>
                            <p>{item.purchases}</p>
                        </div>

                        <div className="dashboard-card">
                            <h3>Transfer In</h3>
                            <p>{item.transfer_in}</p>
                        </div>

                        <div className="dashboard-card">
                            <h3>Transfer Out</h3>
                            <p>{item.transfer_out}</p>
                        </div>

                        <div className="dashboard-card">
                            <h3>Assigned</h3>
                            <p>{item.assigned}</p>
                        </div>

                        <div className="dashboard-card">
                            <h3>Expended</h3>
                            <p>{item.expended}</p>
                        </div>

                        <div className="dashboard-card closing-card">
                            <h3>Closing Balance</h3>
                            <p>{item.closing_balance}</p>
                        </div>

                        <div className="dashboard-card asset-card">
                            <h3>Current Assets</h3>
                            <p>{item.current_asset_quantity}</p>
                        </div>

                    </div>

                    <div className="movement-section">

                        <h3>Stock Movement</h3>

                        <div className="movement">

                            <span>
                                Opening:
                                <strong>
                                    {item.opening_balance}
                                </strong>
                            </span>

                            <span>+</span>

                            <span>
                                Purchases:
                                <strong>
                                    {item.purchases}
                                </strong>
                            </span>

                            <span>+</span>

                            <span>
                                Transfer In:
                                <strong>
                                    {item.transfer_in}
                                </strong>
                            </span>

                            <span>-</span>

                            <span>
                                Transfer Out:
                                <strong>
                                    {item.transfer_out}
                                </strong>
                            </span>

                            <span>-</span>

                            <span>
                                Assigned:
                                <strong>
                                    {item.assigned}
                                </strong>
                            </span>

                            <span>-</span>

                            <span>
                                Expended:
                                <strong>
                                    {item.expended}
                                </strong>
                            </span>

                            <span>=</span>

                            <span className="closing-value">
                                Closing:
                                <strong>
                                    {item.closing_balance}
                                </strong>
                            </span>

                        </div>

                    </div>

                </div>
            ))}

        </div>
    );
}

export default Dashboard;