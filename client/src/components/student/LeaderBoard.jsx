{/* Leaderboard */}

const LeaderBoard = ({username}) => {
    return (
        <>
        <div
  style={{
    background: "#111827",
    border: "1px solid #1e293b",
    borderRadius: 18,
    padding: "24px",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
      flexWrap: "wrap",
      gap: 10,
    }}
  >
    <div>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: "#f8fafc",
        }}
      >
        🏆 Student Leaderboard
      </h2>

      <p
        style={{
          color: "#64748b",
          marginTop: 6,
          fontSize: 14,
        }}
      >
        Compete with students and climb the rankings.
      </p>
    </div>

    <div
      style={{
        background: "rgba(124,58,237,0.15)",
        border: "1px solid #7c3aed",
        color: "#c4b5fd",
        padding: "10px 16px",
        borderRadius: 12,
        fontWeight: 700,
      }}
    >
      Your Rank: #8
    </div>
  </div>

  {[
    { rank: 1, name: "Aarav Sharma", points: 2450 },
    { rank: 2, name: "Priya Verma", points: 2380 },
    { rank: 3, name: "Rahul Singh", points: 2275 },
    { rank: 4, name: "Ananya Patel", points: 2200 },
    { rank: 5, name: "Rohan Gupta", points: 2140 },
    { rank: 6, name: "Sneha Jain", points: 2050 },
    { rank: 7, name: "Arjun Mehta", points: 1930 },
    { rank: 8, name: username, points: 1850, currentUser: true },
  ].map((student) => (
    <div
      key={student.rank}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px",
        borderRadius: 14,
        marginBottom: 10,
        background: student.currentUser
          ? "rgba(124,58,237,0.12)"
          : "#0f172a",
        border: student.currentUser
          ? "1px solid #7c3aed"
          : "1px solid #1e293b",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            color: "#fff",
            background:
              student.rank === 1
                ? "#eab308"
                : student.rank === 2
                ? "#94a3b8"
                : student.rank === 3
                ? "#d97706"
                : "#334155",
          }}
        >
          {student.rank}
        </div>

        <div>
          <p
            style={{
              margin: 0,
              color: "#f8fafc",
              fontWeight: 700,
            }}
          >
            {student.name}
          </p>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: 12,
            }}
          >
            Student
          </p>
        </div>
      </div>

      <div
        style={{
          color: "#22d3ee",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        {student.points} pts
      </div>
    </div>
  ))}
</div>
        </>
    )
}


export default LeaderBoard