import { useEffect, useState } from "react";
import api from "../services/api";

function AssignmentsExpenditures() {
    // ========================================
    // ASSIGNMENT FORM
    // ========================================

    const [assignmentForm, setAssignmentForm] = useState({
        base_id: "1",
        equipment_type_id: "1",
        personnel_name: "",
        quantity: "",
        assigned_date: "",
        remarks: "",
    });

    // ========================================
    // EXPENDITURE FORM
    // ========================================

    const [expenditureForm, setExpenditureForm] = useState({
        base_id: "1",
        equipment_type_id: "1",
        quantity: "",
        expenditure_date: "",
        reason: "",
    });

    // ========================================
    // DATA
    // ========================================

    const [assignments, setAssignments] = useState([]);
    const [expenditures, setExpenditures] = useState([]);

    // ========================================
    // LOADING
    // ========================================

    const [assignmentLoading, setAssignmentLoading] = useState(true);
    const [expenditureLoading, setExpenditureLoading] = useState(true);

    const [assignmentSubmitting, setAssignmentSubmitting] =
        useState(false);

    const [expenditureSubmitting, setExpenditureSubmitting] =
        useState(false);

    // ========================================
    // MESSAGES
    // ========================================

    const [assignmentError, setAssignmentError] = useState("");
    const [assignmentSuccess, setAssignmentSuccess] = useState("");

    const [expenditureError, setExpenditureError] = useState("");
    const [expenditureSuccess, setExpenditureSuccess] = useState("");

    // ========================================
    // ASSIGNMENT FILTERS
    // ========================================

    const [assignmentBaseFilter, setAssignmentBaseFilter] =
        useState("");

    const [assignmentEquipmentFilter, setAssignmentEquipmentFilter] =
        useState("");

    // ========================================
    // EXPENDITURE FILTERS
    // ========================================

    const [expenditureBaseFilter, setExpenditureBaseFilter] =
        useState("");

    const [expenditureEquipmentFilter, setExpenditureEquipmentFilter] =
        useState("");

    // ========================================
    // HANDLE ASSIGNMENT INPUT
    // ========================================

    const handleAssignmentChange = (event) => {
        const { name, value } = event.target;

        setAssignmentForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ========================================
    // HANDLE EXPENDITURE INPUT
    // ========================================

    const handleExpenditureChange = (event) => {
        const { name, value } = event.target;

        setExpenditureForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ========================================
    // GET ASSIGNMENTS
    // ========================================

    const fetchAssignments = async () => {
        try {
            setAssignmentLoading(true);
            setAssignmentError("");

            const response = await api.get("/assignments");

            if (response.data.success) {
                setAssignments(
                    response.data.assignments || []
                );
            } else {
                setAssignmentError(
                    response.data.message ||
                    "Failed to load assignments"
                );
            }
        } catch (err) {
            console.error(
                "Assignment history error:",
                err
            );

            setAssignmentError(
                err.response?.data?.message ||
                "Failed to connect to backend"
            );
        } finally {
            setAssignmentLoading(false);
        }
    };

    // ========================================
    // GET EXPENDITURES
    // ========================================

    const fetchExpenditures = async () => {
        try {
            setExpenditureLoading(true);
            setExpenditureError("");

            const response = await api.get("/expenditures");

            if (response.data.success) {
                setExpenditures(
                    response.data.expenditures || []
                );
            } else {
                setExpenditureError(
                    response.data.message ||
                    "Failed to load expenditures"
                );
            }
        } catch (err) {
            console.error(
                "Expenditure history error:",
                err
            );

            setExpenditureError(
                err.response?.data?.message ||
                "Failed to connect to backend"
            );
        } finally {
            setExpenditureLoading(false);
        }
    };

    // ========================================
    // INITIAL LOAD
    // ========================================

    useEffect(() => {
        fetchAssignments();
        fetchExpenditures();
    }, []);

    // ========================================
    // CREATE ASSIGNMENT
    // ========================================

    const handleAssignmentSubmit = async (event) => {
        event.preventDefault();

        setAssignmentError("");
        setAssignmentSuccess("");

        if (!assignmentForm.personnel_name.trim()) {
            setAssignmentError(
                "Please enter the personnel name."
            );
            return;
        }

        if (
            !assignmentForm.quantity ||
            Number(assignmentForm.quantity) <= 0
        ) {
            setAssignmentError(
                "Quantity must be greater than 0."
            );
            return;
        }

        if (!assignmentForm.assigned_date) {
            setAssignmentError(
                "Please select an assignment date."
            );
            return;
        }

        try {
            setAssignmentSubmitting(true);

            const payload = {
                base_id: Number(
                    assignmentForm.base_id
                ),

                equipment_type_id: Number(
                    assignmentForm.equipment_type_id
                ),

                personnel_name:
                    assignmentForm.personnel_name.trim(),

                quantity: Number(
                    assignmentForm.quantity
                ),

                assigned_date:
                    assignmentForm.assigned_date,

                remarks:
                    assignmentForm.remarks.trim(),
            };

            const response = await api.post(
                "/assignments",
                payload
            );

            if (response.data.success) {
                setAssignmentSuccess(
                    response.data.message ||
                    "Assignment recorded successfully"
                );

                setAssignmentForm({
                    base_id: "1",
                    equipment_type_id: "1",
                    personnel_name: "",
                    quantity: "",
                    assigned_date: "",
                    remarks: "",
                });

                await fetchAssignments();
            } else {
                setAssignmentError(
                    response.data.message ||
                    "Failed to create assignment"
                );
            }
        } catch (err) {
            console.error(
                "Create assignment error:",
                err
            );

            setAssignmentError(
                err.response?.data?.message ||
                "Failed to create assignment"
            );
        } finally {
            setAssignmentSubmitting(false);
        }
    };

    // ========================================
    // CREATE EXPENDITURE
    // ========================================

    const handleExpenditureSubmit = async (event) => {
        event.preventDefault();

        setExpenditureError("");
        setExpenditureSuccess("");

        if (
            !expenditureForm.quantity ||
            Number(expenditureForm.quantity) <= 0
        ) {
            setExpenditureError(
                "Quantity must be greater than 0."
            );
            return;
        }

        if (!expenditureForm.expenditure_date) {
            setExpenditureError(
                "Please select an expenditure date."
            );
            return;
        }

        if (!expenditureForm.reason.trim()) {
            setExpenditureError(
                "Please enter the expenditure reason."
            );
            return;
        }

        try {
            setExpenditureSubmitting(true);

            const payload = {
                base_id: Number(
                    expenditureForm.base_id
                ),

                equipment_type_id: Number(
                    expenditureForm.equipment_type_id
                ),

                quantity: Number(
                    expenditureForm.quantity
                ),

                expenditure_date:
                    expenditureForm.expenditure_date,

                reason:
                    expenditureForm.reason.trim(),
            };

            const response = await api.post(
                "/expenditures",
                payload
            );

            if (response.data.success) {
                setExpenditureSuccess(
                    response.data.message ||
                    "Expenditure recorded successfully"
                );

                setExpenditureForm({
                    base_id: "1",
                    equipment_type_id: "1",
                    quantity: "",
                    expenditure_date: "",
                    reason: "",
                });

                await fetchExpenditures();
            } else {
                setExpenditureError(
                    response.data.message ||
                    "Failed to create expenditure"
                );
            }
        } catch (err) {
            console.error(
                "Create expenditure error:",
                err
            );

            setExpenditureError(
                err.response?.data?.message ||
                "Failed to create expenditure"
            );
        } finally {
            setExpenditureSubmitting(false);
        }
    };

    // ========================================
    // FILTER ASSIGNMENTS
    // ========================================

    const filteredAssignments = assignments.filter(
        (assignment) => {
            const matchesBase =
                !assignmentBaseFilter ||
                String(assignment.base_id) ===
                    String(assignmentBaseFilter);

            const matchesEquipment =
                !assignmentEquipmentFilter ||
                String(
                    assignment.equipment_type_id
                ) ===
                    String(
                        assignmentEquipmentFilter
                    );

            return (
                matchesBase &&
                matchesEquipment
            );
        }
    );

    // ========================================
    // FILTER EXPENDITURES
    // ========================================

    const filteredExpenditures = expenditures.filter(
        (expenditure) => {
            const matchesBase =
                !expenditureBaseFilter ||
                String(expenditure.base_id) ===
                    String(expenditureBaseFilter);

            const matchesEquipment =
                !expenditureEquipmentFilter ||
                String(
                    expenditure.equipment_type_id
                ) ===
                    String(
                        expenditureEquipmentFilter
                    );

            return (
                matchesBase &&
                matchesEquipment
            );
        }
    );

    // ========================================
    // DATE FORMAT
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
    // CLEAR ASSIGNMENT FILTERS
    // ========================================

    const clearAssignmentFilters = () => {
        setAssignmentBaseFilter("");
        setAssignmentEquipmentFilter("");
    };

    // ========================================
    // CLEAR EXPENDITURE FILTERS
    // ========================================

    const clearExpenditureFilters = () => {
        setExpenditureBaseFilter("");
        setExpenditureEquipmentFilter("");
    };

    // ========================================
    // REFRESH ALL
    // ========================================

    const refreshAll = () => {
        fetchAssignments();
        fetchExpenditures();
    };

    // ========================================
    // PAGE
    // ========================================

    return (
        <div className="assignments-page">

            {/* ========================================
                HEADER
            ======================================== */}

            <div className="page-header">

                <div>
                    <h1>
                        Assignments & Expenditures
                    </h1>

                    <p>
                        Manage assigned and expended
                        military assets
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={refreshAll}
                >
                    Refresh
                </button>

            </div>


            {/* ========================================
                ASSIGNMENT FORM
            ======================================== */}

            <section className="assignment-form-card">

                <h2>
                    Add Assignment
                </h2>

                {assignmentSuccess && (
                    <div className="success-message">
                        {assignmentSuccess}
                    </div>
                )}

                {assignmentError && (
                    <div className="error-message">
                        {assignmentError}
                    </div>
                )}

                <form
                    className="asset-form"
                    onSubmit={handleAssignmentSubmit}
                >

                    <div className="form-grid">

                        {/* Base ID */}

                        <div className="form-group">

                            <label htmlFor="assignment-base-id">
                                Base ID
                            </label>

                            <input
                                id="assignment-base-id"
                                type="number"
                                min="1"
                                name="base_id"
                                value={
                                    assignmentForm.base_id
                                }
                                onChange={
                                    handleAssignmentChange
                                }
                                required
                            />

                        </div>


                        {/* Equipment Type */}

                        <div className="form-group">

                            <label htmlFor="assignment-equipment-id">
                                Equipment Type ID
                            </label>

                            <input
                                id="assignment-equipment-id"
                                type="number"
                                min="1"
                                name="equipment_type_id"
                                value={
                                    assignmentForm.equipment_type_id
                                }
                                onChange={
                                    handleAssignmentChange
                                }
                                required
                            />

                        </div>


                        {/* Personnel */}

                        <div className="form-group">

                            <label htmlFor="personnel-name">
                                Personnel Name
                            </label>

                            <input
                                id="personnel-name"
                                type="text"
                                name="personnel_name"
                                placeholder="Enter personnel name"
                                value={
                                    assignmentForm.personnel_name
                                }
                                onChange={
                                    handleAssignmentChange
                                }
                                required
                            />

                        </div>


                        {/* Quantity */}

                        <div className="form-group">

                            <label htmlFor="assignment-quantity">
                                Quantity
                            </label>

                            <input
                                id="assignment-quantity"
                                type="number"
                                min="1"
                                name="quantity"
                                placeholder="Enter quantity"
                                value={
                                    assignmentForm.quantity
                                }
                                onChange={
                                    handleAssignmentChange
                                }
                                required
                            />

                        </div>


                        {/* Assigned Date */}

                        <div className="form-group">

                            <label htmlFor="assigned-date">
                                Assigned Date
                            </label>

                            <input
                                id="assigned-date"
                                type="date"
                                name="assigned_date"
                                value={
                                    assignmentForm.assigned_date
                                }
                                onChange={
                                    handleAssignmentChange
                                }
                                required
                            />

                        </div>


                        {/* Remarks */}

                        <div className="form-group">

                            <label htmlFor="assignment-remarks">
                                Remarks
                            </label>

                            <input
                                id="assignment-remarks"
                                type="text"
                                name="remarks"
                                placeholder="Assignment remarks"
                                value={
                                    assignmentForm.remarks
                                }
                                onChange={
                                    handleAssignmentChange
                                }
                            />

                        </div>

                    </div>


                    <div className="form-actions">

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={
                                assignmentSubmitting
                            }
                        >
                            {assignmentSubmitting
                                ? "Processing..."
                                : "Add Assignment"}
                        </button>

                    </div>

                </form>

            </section>


            {/* ========================================
                ASSIGNMENT FILTERS
            ======================================== */}

            <section className="assignment-filter-card">

                <div className="filter-header">

                    <h2>
                        Assignment Filters
                    </h2>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={
                            clearAssignmentFilters
                        }
                    >
                        Clear Filters
                    </button>

                </div>


                <div className="assignment-filter-grid">

                    <div className="form-group">

                        <label htmlFor="assignment-base-filter">
                            Base ID
                        </label>

                        <input
                            id="assignment-base-filter"
                            type="number"
                            min="1"
                            placeholder="All bases"
                            value={
                                assignmentBaseFilter
                            }
                            onChange={(event) =>
                                setAssignmentBaseFilter(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="assignment-equipment-filter">
                            Equipment Type ID
                        </label>

                        <input
                            id="assignment-equipment-filter"
                            type="number"
                            min="1"
                            placeholder="All equipment"
                            value={
                                assignmentEquipmentFilter
                            }
                            onChange={(event) =>
                                setAssignmentEquipmentFilter(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                </div>

            </section>


            {/* ========================================
                ASSIGNMENT HISTORY
            ======================================== */}

            <section className="assignment-list-card">

                <div className="history-header">

                    <div>
                        <h2>
                            Assignment History
                        </h2>

                        <p>
                            Showing{" "}
                            <strong>
                                {
                                    filteredAssignments.length
                                }
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {assignments.length}
                            </strong>{" "}
                            assignments
                        </p>
                    </div>

                </div>


                {assignmentLoading ? (

                    <div className="loading-message">
                        Loading assignments...
                    </div>

                ) : filteredAssignments.length === 0 ? (

                    <div className="no-data">
                        No assignments found.
                    </div>

                ) : (

                    <div className="assignment-table-container">

                        <table className="data-table">

                            <thead>

                                <tr>
                                    <th>ID</th>
                                    <th>Base</th>
                                    <th>Equipment</th>
                                    <th>Personnel</th>
                                    <th>Quantity</th>
                                    <th>Assigned Date</th>
                                    <th>Remarks</th>
                                </tr>

                            </thead>


                            <tbody>

                                {filteredAssignments.map(
                                    (assignment) => (

                                        <tr
                                            key={
                                                assignment.id
                                            }
                                        >

                                            <td>
                                                {
                                                    assignment.id
                                                }
                                            </td>

                                            <td>
                                                {
                                                    assignment.base_name ||
                                                    assignment.base_id ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    assignment.equipment_type_name ||
                                                    assignment.equipment_type_id ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    assignment.personnel_name
                                                }
                                            </td>

                                            <td>
                                                {
                                                    assignment.quantity
                                                }
                                            </td>

                                            <td>
                                                {formatDate(
                                                    assignment.assigned_date
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    assignment.remarks ||
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


            {/* ========================================
                EXPENDITURE FORM
            ======================================== */}

            <section className="expenditure-form-card">

                <h2>
                    Add Expenditure
                </h2>

                {expenditureSuccess && (
                    <div className="success-message">
                        {expenditureSuccess}
                    </div>
                )}

                {expenditureError && (
                    <div className="error-message">
                        {expenditureError}
                    </div>
                )}

                <form
                    className="asset-form"
                    onSubmit={
                        handleExpenditureSubmit
                    }
                >

                    <div className="form-grid">

                        {/* Base ID */}

                        <div className="form-group">

                            <label htmlFor="expenditure-base-id">
                                Base ID
                            </label>

                            <input
                                id="expenditure-base-id"
                                type="number"
                                min="1"
                                name="base_id"
                                value={
                                    expenditureForm.base_id
                                }
                                onChange={
                                    handleExpenditureChange
                                }
                                required
                            />

                        </div>


                        {/* Equipment Type */}

                        <div className="form-group">

                            <label htmlFor="expenditure-equipment-id">
                                Equipment Type ID
                            </label>

                            <input
                                id="expenditure-equipment-id"
                                type="number"
                                min="1"
                                name="equipment_type_id"
                                value={
                                    expenditureForm.equipment_type_id
                                }
                                onChange={
                                    handleExpenditureChange
                                }
                                required
                            />

                        </div>


                        {/* Quantity */}

                        <div className="form-group">

                            <label htmlFor="expenditure-quantity">
                                Quantity
                            </label>

                            <input
                                id="expenditure-quantity"
                                type="number"
                                min="1"
                                name="quantity"
                                placeholder="Enter quantity"
                                value={
                                    expenditureForm.quantity
                                }
                                onChange={
                                    handleExpenditureChange
                                }
                                required
                            />

                        </div>


                        {/* Expenditure Date */}

                        <div className="form-group">

                            <label htmlFor="expenditure-date">
                                Expenditure Date
                            </label>

                            <input
                                id="expenditure-date"
                                type="date"
                                name="expenditure_date"
                                value={
                                    expenditureForm.expenditure_date
                                }
                                onChange={
                                    handleExpenditureChange
                                }
                                required
                            />

                        </div>


                        {/* Reason */}

                        <div className="form-group">

                            <label htmlFor="expenditure-reason">
                                Reason
                            </label>

                            <input
                                id="expenditure-reason"
                                type="text"
                                name="reason"
                                placeholder="Reason for expenditure"
                                value={
                                    expenditureForm.reason
                                }
                                onChange={
                                    handleExpenditureChange
                                }
                                required
                            />

                        </div>

                    </div>


                    <div className="form-actions">

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={
                                expenditureSubmitting
                            }
                        >
                            {expenditureSubmitting
                                ? "Processing..."
                                : "Add Expenditure"}
                        </button>

                    </div>

                </form>

            </section>


            {/* ========================================
                EXPENDITURE FILTERS
            ======================================== */}

            <section className="expenditure-filter-card">

                <div className="filter-header">

                    <h2>
                        Expenditure Filters
                    </h2>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={
                            clearExpenditureFilters
                        }
                    >
                        Clear Filters
                    </button>

                </div>


                <div className="expenditure-filter-grid">

                    <div className="form-group">

                        <label htmlFor="expenditure-base-filter">
                            Base ID
                        </label>

                        <input
                            id="expenditure-base-filter"
                            type="number"
                            min="1"
                            placeholder="All bases"
                            value={
                                expenditureBaseFilter
                            }
                            onChange={(event) =>
                                setExpenditureBaseFilter(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="expenditure-equipment-filter">
                            Equipment Type ID
                        </label>

                        <input
                            id="expenditure-equipment-filter"
                            type="number"
                            min="1"
                            placeholder="All equipment"
                            value={
                                expenditureEquipmentFilter
                            }
                            onChange={(event) =>
                                setExpenditureEquipmentFilter(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                </div>

            </section>


            {/* ========================================
                EXPENDITURE HISTORY
            ======================================== */}

            <section className="expenditure-list-card">

                <div className="history-header">

                    <div>
                        <h2>
                            Expenditure History
                        </h2>

                        <p>
                            Showing{" "}
                            <strong>
                                {
                                    filteredExpenditures.length
                                }
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {expenditures.length}
                            </strong>{" "}
                            expenditures
                        </p>
                    </div>

                </div>


                {expenditureLoading ? (

                    <div className="loading-message">
                        Loading expenditures...
                    </div>

                ) : filteredExpenditures.length === 0 ? (

                    <div className="no-data">
                        No expenditures found.
                    </div>

                ) : (

                    <div className="expenditure-table-container">

                        <table className="data-table">

                            <thead>

                                <tr>
                                    <th>ID</th>
                                    <th>Base</th>
                                    <th>Equipment</th>
                                    <th>Quantity</th>
                                    <th>Expenditure Date</th>
                                    <th>Reason</th>
                                </tr>

                            </thead>


                            <tbody>

                                {filteredExpenditures.map(
                                    (expenditure) => (

                                        <tr
                                            key={
                                                expenditure.id
                                            }
                                        >

                                            <td>
                                                {
                                                    expenditure.id
                                                }
                                            </td>

                                            <td>
                                                {
                                                    expenditure.base_name ||
                                                    expenditure.base_id ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    expenditure.equipment_type_name ||
                                                    expenditure.equipment_type_id ||
                                                    "-"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    expenditure.quantity
                                                }
                                            </td>

                                            <td>
                                                {formatDate(
                                                    expenditure.expenditure_date
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    expenditure.reason ||
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

export default AssignmentsExpenditures;