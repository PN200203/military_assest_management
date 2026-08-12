import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function Purchases() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        base_id: 1,
        equipment_type_id: 1,
        quantity: "",
        purchase_date: "",
        reference_number: "",
        remarks: "",
    });

    // ==========================================
    // GET TOKEN
    // ==========================================

    const getToken = () => {
        return localStorage.getItem("token");
    };

    // ==========================================
    // FETCH PURCHASES
    // ==========================================

    const fetchPurchases = async () => {
        try {
            setLoading(true);
            setError("");
            setMessage("");

            const token = getToken();

            const response = await fetch(
                `${API_URL}/purchases`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load purchases"
                );
            }

            setPurchases(data.purchases || []);
        } catch (err) {
            console.error("Fetch purchases error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // LOAD PURCHASES
    // ==========================================

    useEffect(() => {
        fetchPurchases();
    }, []);

    // ==========================================
    // HANDLE FORM CHANGE
    // ==========================================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ==========================================
    // SUBMIT PURCHASE
    // ==========================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        // Validate quantity
        if (
            !formData.quantity ||
            Number(formData.quantity) <= 0
        ) {
            setError("Quantity must be greater than 0");
            return;
        }

        // Validate purchase date
        if (!formData.purchase_date) {
            setError("Purchase date is required");
            return;
        }

        try {
            const token = getToken();

            const response = await fetch(
                `${API_URL}/purchases`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        base_id: Number(formData.base_id),
                        equipment_type_id: Number(
                            formData.equipment_type_id
                        ),
                        quantity: Number(formData.quantity),
                        purchase_date:
                            formData.purchase_date,
                        reference_number:
                            formData.reference_number,
                        remarks: formData.remarks,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to create purchase"
                );
            }

            setMessage(
                "Purchase recorded successfully"
            );

            // Reset form
            setFormData({
                base_id: 1,
                equipment_type_id: 1,
                quantity: "",
                purchase_date: "",
                reference_number: "",
                remarks: "",
            });

            // Reload purchase history
            await fetchPurchases();

        } catch (err) {
            console.error(
                "Create purchase error:",
                err
            );

            setError(err.message);
        }
    };

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="purchases-page">

            {/* ==================================
                PAGE HEADER
            ================================== */}

            <div className="page-header">

                <div>
                    <h1>Purchases</h1>

                    <p>
                        Manage military asset purchases
                    </p>
                </div>

                <button
                    onClick={fetchPurchases}
                    className="refresh-button"
                    type="button"
                >
                    Refresh
                </button>

            </div>

            {/* ==================================
                SUCCESS MESSAGE
            ================================== */}

            {message && (
                <div className="success-message">
                    {message}
                </div>
            )}

            {/* ==================================
                ERROR MESSAGE
            ================================== */}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* ==================================
                ADD PURCHASE
            ================================== */}

            <section className="purchase-form-card">

                <h2>Add Purchase</h2>

                <form onSubmit={handleSubmit}>

                    <div className="form-grid">

                        {/* Base ID */}

                        <div className="form-group">

                            <label htmlFor="base_id">
                                Base ID
                            </label>

                            <input
                                id="base_id"
                                type="number"
                                name="base_id"
                                value={formData.base_id}
                                onChange={handleChange}
                                min="1"
                                required
                            />

                        </div>

                        {/* Equipment Type */}

                        <div className="form-group">

                            <label htmlFor="equipment_type_id">
                                Equipment Type ID
                            </label>

                            <input
                                id="equipment_type_id"
                                type="number"
                                name="equipment_type_id"
                                value={
                                    formData.equipment_type_id
                                }
                                onChange={handleChange}
                                min="1"
                                required
                            />

                        </div>

                        {/* Quantity */}

                        <div className="form-group">

                            <label htmlFor="quantity">
                                Quantity
                            </label>

                            <input
                                id="quantity"
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                min="1"
                                placeholder="Enter quantity"
                                required
                            />

                        </div>

                        {/* Purchase Date */}

                        <div className="form-group">

                            <label htmlFor="purchase_date">
                                Purchase Date
                            </label>

                            <input
                                id="purchase_date"
                                type="date"
                                name="purchase_date"
                                value={
                                    formData.purchase_date
                                }
                                onChange={handleChange}
                                required
                            />

                        </div>

                        {/* Reference Number */}

                        <div className="form-group">

                            <label htmlFor="reference_number">
                                Reference Number
                            </label>

                            <input
                                id="reference_number"
                                type="text"
                                name="reference_number"
                                value={
                                    formData.reference_number
                                }
                                onChange={handleChange}
                                placeholder="Example: PO-002"
                            />

                        </div>

                        {/* Remarks */}

                        <div className="form-group">

                            <label htmlFor="remarks">
                                Remarks
                            </label>

                            <input
                                id="remarks"
                                type="text"
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleChange}
                                placeholder="Purchase remarks"
                            />

                        </div>

                    </div>

                    <button
                        type="submit"
                        className="submit-button"
                    >
                        Add Purchase
                    </button>

                </form>

            </section>

            {/* ==================================
                PURCHASE HISTORY
            ================================== */}

            <section className="purchase-list-card">

                <div className="section-header">

                    <div>
                        <h2>Purchase History</h2>

                        {!loading &&
                            purchases.length > 0 && (
                                <p>
                                    Showing{" "}
                                    {purchases.length}{" "}
                                    purchase
                                    {purchases.length !== 1
                                        ? "s"
                                        : ""}
                                </p>
                            )}
                    </div>

                </div>

                {/* Loading */}

                {loading && (
                    <div className="loading-message">
                        Loading purchases...
                    </div>
                )}

                {/* Empty */}

                {!loading &&
                    purchases.length === 0 && (
                        <div className="empty-message">
                            No purchases found.
                        </div>
                    )}

                {/* Table */}

                {!loading &&
                    purchases.length > 0 && (

                        <div className="table-container">

                            <table>

                                <thead>

                                    <tr>

                                        <th>ID</th>

                                        <th>Base</th>

                                        <th>
                                            Equipment
                                        </th>

                                        <th>
                                            Quantity
                                        </th>

                                        <th>
                                            Purchase Date
                                        </th>

                                        <th>
                                            Reference
                                        </th>

                                        <th>
                                            Remarks
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {purchases.map(
                                        (purchase) => (

                                            <tr
                                                key={
                                                    purchase.id
                                                }
                                            >

                                                <td>
                                                    {
                                                        purchase.id
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        purchase.base_name ||
                                                        purchase.base_id
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        purchase.equipment_type_name ||
                                                        purchase.equipment_type_id
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        purchase.quantity
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        purchase.purchase_date
                                                            ? new Date(
                                                                purchase.purchase_date
                                                            ).toLocaleDateString()
                                                            : "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        purchase.reference_number ||
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        purchase.remarks ||
                                                        "-"
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

            </section>

        </div>
    );
}

export default Purchases;