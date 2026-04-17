import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [selectedBus, setSelectedBus] = useState({});

    // ✅ Fetch pending students
    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/auth/pending-students')
            .then(res => res.json())
            .then(data => {
                console.log("PENDING STUDENTS:", data); // ✅ debug
                setStudents(data);
            })
            .catch(err => console.error("FETCH ERROR:", err));
    }, []);

    // ✅ Approve student
    const approveStudent = async (id) => {
        const busNumber = selectedBus[id] || "B101";

        console.log("APPROVING:", id, busNumber); // ✅ debug

        try {
            const res = await fetch('http://127.0.0.1:5000/api/auth/approve-student', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: id,
                    busNumber: busNumber
                })
            });

            const data = await res.json();
            console.log("SERVER RESPONSE:", data); // ✅ debug

            if (!res.ok) {
                alert(data.error || "Approval failed");
                return;
            }

            alert("Student Approved!");

            // ✅ remove approved student from UI
            setStudents(prev => prev.filter(s => s._id !== id));

        } catch (err) {
            console.error("APPROVE ERROR:", err);
            alert("Server connection failed");
        }
    };

    return (
        <div style={{ padding: "30px", background: "#0f172a", minHeight: "100vh", color: "white" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "30px" }}>
                <h2 style={{ margin: 0, color: "#38bdf8", fontSize: "28px" }}>🚍 Admin Dashboard</h2>
                <button 
                  onClick={() => {
                    localStorage.removeItem('userToken');
                    navigate('/');
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(45deg, #1e293b, #334155)',
                    color: '#e2e8f0',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#ff3366'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#ff3366'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(45deg, #1e293b, #334155)'; e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#475569'; }}
                >
                  <span>⟵</span> SIGN OUT
                </button>
            </div>

            {students.length === 0 ? (
                <p>No pending students</p>
            ) : (
                students.map((s) => (
                    <div key={s._id} style={{
                        border: "1px solid #ccc",
                        padding: "10px",
                        marginBottom: "10px",
                        borderRadius: "8px"
                    }}>
                        <p><strong>{s.name}</strong></p>
                        <p>{s.email}</p>

                        <select
                            value={selectedBus[s._id] || "B101"}
                            onChange={(e) =>
                                setSelectedBus({
                                    ...selectedBus,
                                    [s._id]: e.target.value
                                })
                            }
                        >
                            <option value="B101">B101</option>
                            <option value="B102">B102</option>
                            <option value="B103">B103</option>
                        </select>

                        <button
                            onClick={() => approveStudent(s._id)}
                            style={{ marginLeft: "10px" }}
                        >
                            Approve
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}