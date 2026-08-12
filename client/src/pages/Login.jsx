import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {

    const navigate = useNavigate();


    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    // =================================================
    // LOGIN
    // =================================================

    const handleLogin = async (e) => {

        e.preventDefault();

        setError("");


        // Validate fields

        if (!email || !password) {

            setError(
                "Please enter email and password"
            );

            return;
        }


        try {

            setLoading(true);


            // Call backend login API

            const response = await api.post(
                "/auth/login",
                {
                    email,
                    password
                }
            );


            console.log(
                "Login response:",
                response.data
            );


            // Successful login

            if (
                response.data.success &&
                response.data.token
            ) {

                // Save JWT

                localStorage.setItem(
                    "token",
                    response.data.token
                );


                // Save user if backend returns user

                if (response.data.user) {

                    localStorage.setItem(
                        "user",
                        JSON.stringify(
                            response.data.user
                        )
                    );

                }


                // Go to dashboard

                navigate("/");

            } else {

                setError(
                    response.data.message ||
                    "Login failed"
                );

            }

        } catch (err) {

            console.error(
                "Login error:",
                err
            );


            setError(
                err.response?.data?.message ||
                "Invalid email or password"
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="login-page">

            <div className="login-card">


                {/* TITLE */}

                <h1>
                    Military Asset Management
                </h1>


                <p className="login-subtitle">
                    Admin Login
                </p>


                {/* ERROR */}

                {error && (

                    <div className="error-message">
                        {error}
                    </div>

                )}


                {/* LOGIN FORM */}

                <form onSubmit={handleLogin}>


                    {/* EMAIL */}

                    <div className="form-group">

                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }
                            placeholder="Enter email"
                            autoComplete="email"
                        />

                    </div>


                    {/* PASSWORD */}

                    <div className="form-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Enter password"
                            autoComplete="current-password"
                        />

                    </div>


                    {/* LOGIN BUTTON */}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Logging in..."
                            : "Login"
                        }

                    </button>

                </form>

            </div>

        </div>

    );

}

export default Login;