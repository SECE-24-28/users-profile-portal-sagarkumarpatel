"use client";

import { useEffect, useState } from "react";

const GRAPHQL_ENDPOINT = "http://localhost:5000/graphql";

interface Student {
  id: string;
  name: string;
  email: string;
  profile?: {
    avatarUrl?: string;
    bio?: string;
    phone?: string;
  };
}

export default function StudentDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Fetch all students (Read)
  const fetchStudents = async () => {
    const query = `
      query GetStudents {
        students {
          id
          name
          email
          profile {
            avatarUrl
            bio
            phone
          }
        }
      }
    `;

    try {
      const res = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      if (json.data) setStudents(json.data.students);
    } catch (err) {
      console.error("Error fetching students", err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Form Submission handler (Create)
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const mutation = `
      mutation AddStudent($email: String!, $name: String!, $avatarUrl: String, $bio: String, $phone: String) {
        addStudent(email: $email, name: $name, avatarUrl: $avatarUrl, bio: $bio, phone: $phone) {
          id
        }
      }
    `;

    try {
      await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: mutation,
          variables: { email, name, avatarUrl, bio, phone },
        }),
      });
      // Clear inputs and refresh list
      setName(""); setEmail(""); setBio(""); setPhone(""); setAvatarUrl("");
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Handler (Delete)
  const handleDelete = async (id: string) => {
    const mutation = `
      mutation DeleteStudent($id: ID!) {
        deleteStudent(id: $id)
      }
    `;

    try {
      await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: mutation, variables: { id } }),
      });
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>🎓 Student Profile Manager</h1>
      
      {/* Add New Student Section */}
      <form onSubmit={handleAddStudent} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px", border: "1px solid #ccc", padding: "15px", borderRadius: "8px" }}>
        <h3>Add New Student</h3>
        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="text" placeholder="Profile Image URL" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
        <input type="text" placeholder="Bio" value={bio} onChange={e => setBio(e.target.value)} />
        <input type="text" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
        <button type="submit" style={{ cursor: "pointer", background: "#0070f3", color: "white", padding: "10px", border: "none", borderRadius: "4px" }}>Save Student</button>
      </form>

      {/* Renders Student Profiles */}
      <h3>All Registered Students ({students.length})</h3>
      <div style={{ display: "grid", gap: "15px" }}>
        {students.map((student) => (
          <div key={student.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px", border: "1px solid #ddd", borderRadius: "6px" }}>
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <img 
                src={student.profile?.avatarUrl || "https://via.placeholder.com/150"} 
                alt="Profile" 
                style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", background: "#eee" }} 
              />
              <div>
                <strong>{student.name}</strong> ({student.email})
                <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: "#666" }}>
                  {student.profile?.bio || "No biography provided."} | {student.profile?.phone || "No phone"}
                </p>
              </div>
            </div>
            <button onClick={() => handleDelete(student.id)} style={{ background: "#ff0000", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}