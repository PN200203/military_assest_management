import { useEffect, useState } from "react";
import api from "../services/api";

function Transfers() {
    // ========================================
    // FORM STATE
    // ========================================

    const [formData, setFormData] = useState({
        from_base_id: "1",
        to_base_id: "2",
        equipment_type_id: "1",
        quantity: "",
        transfer_date: "",
        remarks: "",
    });

    // ========================================
    // TRANSFER HISTORY
    // ========================================

    const [transfers, setTransfers] = useState([]);

    // ========================================
    // LOADING / ERROR / SUCCESS
    // ========================================

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // ========================================
    // FILTERS
    // ========================================

    const [fromBaseFilter, setFromBaseFilter] = useState("");
    const [toBaseFilter, setToBaseFilter] = useState("");
    const [equipmentFilter, setEquipmentFilter] = useState("");

    // ========================================
    // HANDLE INPUT CHANGE
    // ========================================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }));
    };

    // ========================================
    // FETCH TRANSFER HISTORY
    // ========================================

    const fetchTransfers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/transfers");

            if (response.data.success) {
                setTransfers(response.data.transfers || []);
            } else {
                setError(
                    response.data.message ||
                    "Failed to load transfer history"
                );
            }
        } catch (err) {
            console.error("Transfer history error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to connect to backend"
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // LOAD TRANSFERS ON PAGE OPEN
    // ========================================

    useEffect(() => {
        fetchTransfers();
    }, []);

    // ========================================
    // SUBMIT TRANSFER
    // ========================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        // ========================================
        // VALIDATION
        // ========================================

        if (!formData.from_base_id) {
            setError("Please enter the source Base ID.");
            return;
        }

        if (!formData.to_base_id) {
            setError("Please enter the destination Base ID.");
            return;
        }

        if (
            Number(formData.from_base_id) ===
            Number(formData.to_base_id)
        ) {
            setError(
                "Source Base and Destination Base cannot be the same."
            );
            return;
        }

        if (!formData.equipment_type_id) {
            setError("Please enter the Equipment Type ID.");
            return;
        }

        if (
            !formData.quantity ||
            Number(formData.quantity) <= 0
        ) {
            setError("Quantity must be greater than 0.");
            return;
        }

        if (!formData.transfer_date) {
            setError("Please select a transfer date.");
            return;
        }

        // ========================================
        // CREATE TRANSFER
        // ========================================

        try {
            setSubmitting(true);

            const payload = {
                from_base_id: Number(formData.from_base_id),
                to_base_id: Number(formData.to_base_id),
                equipment_type_id: Number(
                    formData.equipment_type_id
                ),
                quantity: Number(formData.quantity),
                transfer_date: formData.transfer_date,
                remarks: formData.remarks.trim(),
            };

            const response = await api.post(
                "/transfers",
                payload
            );

            if (response.data.success) {
                setSuccess(
                    response.data.message ||
                    "Transfer completed successfully"
                );

                // ========================================
                // RESET FORM
                // ========================================

                setFormData({
                    from_base_id: "1",
                    to_base_id: "2",
                    equipment_type_id: "1",
                    quantity: "",
                    transfer_date: "",
                    remarks: "",
                });

                // ========================================
                // REFRESH HISTORY
                // ========================================

                await fetchTransfers();
            } else {
                setError(
                    response.data.message ||
                    "Failed to create transfer"
                );
            }
        } catch (err) {
            console.error("Create transfer error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to create transfer"
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ========================================
    // CLEAR FILTERS
    // ========================================

    const clearFilters = () => {
        setFromBaseFilter("");
        setToBaseFilter("");
        setEquipmentFilter("");
    };

    // ========================================
    // FILTER TRANSFERS
    // ========================================

    const filteredTransfers = transfers.filter((transfer) => {
        const matchesFromBase =
            !fromBaseFilter ||
            String(transfer.from_base_id) ===
                String(fromBaseFilter);

        const matchesToBase =
            !toBaseFilter ||
            String(transfer.to_base_id) ===
                String(toBaseFilter);

        const matchesEquipment =
            !equipmentFilter ||
            String(transfer.equipment_type_id) ===
                String(equipmentFilter);

        return (
            matchesFromBase &&
            matchesToBase &&
            matchesEquipment
        );
    });

    // ========================================
    // FORMAT DATE
    // ========================================

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString();
    };

    // ========================================
    // PAGE
    // ========================================

    return (
        <div className="page-container">

            {/* ========================================
                PAGE HEADER
            ======================================== */}

            <div className="page-header">

                <div>
                    <h1>Transfers</h1>

                    <p>
                        Manage military asset transfers
                        between bases
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchTransfers}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Refresh"}
                </button>

            </div>

            {/* ========================================
                SUCCESS MESSAGE
            ======================================== */}

            {success && (
                <div className="success-message">
                    {success}
                </div>
            )}

            {/* ========================================
                ERROR MESSAGE
            ======================================== */}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* ========================================
                ADD TRANSFER
            ======================================== */}

            <section className="form-section">

                <h2>Add Transfer</h2>

                <form
                    className="asset-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">
                        <label htmlFor="from_base_id">
                            From Base ID
                        </label>

                        <input
                            id="from_base_id"
                            type="number"
                            name="from_base_id"
                            min="1"
                            value={formData.from_base_id}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="to_base_id">
                            To Base ID
                        </label>

                        <input
                            id="to_base_id"
                            type="number"
                            name="to_base_id"
                            min="1"
                            value={formData.to_base_id}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="equipment_type_id">
                            Equipment Type ID
                        </label>

                        <input
                            id="equipment_type_id"
                            type="number"
                            name="equipment_type_id"
                            min="1"
                            value={formData.equipment_type_id}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="quantity">
                            Quantity
                        </label>

                        <input
                            id="quantity"
                            type="number"
                            name="quantity"
                            min="1"
                            placeholder="Enter quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="transfer_date">
                            Transfer Date
                        </label>

                        <input
                            id="transfer_date"
                            type="date"
                            name="transfer_date"
                            value={formData.transfer_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="remarks">
                            Remarks
                        </label>

                        <input
                            id="remarks"
                            type="text"
                            name="remarks"
                            placeholder="Transfer remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="primary-button"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Processing..."
                                : "Complete Transfer"}
                        </button>
                    </div>

                </form>

            </section>

            {/* ========================================
                FILTER SECTION
            ======================================== */}

            <section className="filter-section">

                <div className="filter-header">

                    <h2>Transfer Filters</h2>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </button>

                </div>

                <div className="filter-grid">

                    <div className="form-group">
                        <label htmlFor="fromBaseFilter">
                            From Base ID
                        </label>

                        <input
                            id="fromBaseFilter"
                            type="number"
                            min="1"
                            placeholder="All bases"
                            value={fromBaseFilter}
                            onChange={(event) =>
                                setFromBaseFilter(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="toBaseFilter">
                            To Base ID
                        </label>

                        <input
                            id="toBaseFilter"
                            type="number"
                            min="1"
                            placeholder="All bases"
                            value={toBaseFilter}
                            onChange={(event) =>
                                setToBaseFilter(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="equipmentFilter">
                            Equipment Type ID
                        </label>

                        <input
                            id="equipmentFilter"
                            type="number"
                            min="1"
                            placeholder="All equipment"
                            value={equipmentFilter}
                            onChange={(event) =>
                                setEquipmentFilter(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                </div>

            </section>

            {/* ========================================
                TRANSFER HISTORY
            ======================================== */}

            <section className="history-section">

                <div className="history-header">

                    <div>
                        <h2>Transfer History</h2>

                        <p>
                            Showing{" "}
                            <strong>
                                {filteredTransfers.length}
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {transfers.length}
                            </strong>{" "}
                            transfers
                        </p>
                    </div>

                </div>

                {/* Loading */}

                {loading ? (

                    <div className="loading-message">
                        Loading transfer history...
                    </div>

                ) : filteredTransfers.length === 0 ? (

                    <div className="no-data">
                        No transfers found.
                    </div>

                ) : (

                    <div className="table-container">

                        <table className="data-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>From Base</th>
                                    <th>To Base</th>
                                    <th>Equipment</th>
                                    <th>Quantity</th>
                                    <th>Transfer Date</th>
                                    <th>Status</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>

                            <tbody>

                                {filteredTransfers.map(
                                    (transfer) => (
                                        <tr key={transfer.id}>

                                            <td>
                                                {transfer.id}
                                            </td>

                                            <td>
                                                {transfer.from_base_name ||
                                                    transfer.from_base_id ||
                                                    "-"}
                                            </td>

                                            <td>
                                                {transfer.to_base_name ||
                                                    transfer.to_base_id ||
                                                    "-"}
                                            </td>

                                            <td>
                                                {transfer.equipment_type_name ||
                                                    transfer.equipment_type_id ||
                                                    "-"}
                                            </td>

                                            <td>
                                                {transfer.quantity}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    transfer.transfer_date
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        transfer.status ===
                                                        "COMPLETED"
                                                            ? "status-completed"
                                                            : "status-pending"
                                                    }
                                                >
                                                    {transfer.status ||
                                                        "COMPLETED"}
                                                </span>
                                            </td>

                                            <td>
                                                {transfer.remarks ||
                                                    "-"}
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

export default Transfers;