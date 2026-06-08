import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaderboard } from '../../redux/slices/studentSlice';

const LeaderBoard = () => {
  const dispatch = useDispatch();
  const { leaderboard, leaderboardLoading } = useSelector((s) => s.students);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  const currentUserId = user?._id ?? user?.id;
  const sorted = [...(leaderboard ?? [])].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0)
  );
  const currentRank =
    sorted.findIndex(
      (student) => student._id === currentUserId || student.id === currentUserId
    ) + 1;

  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid #1e293b',
        borderRadius: 18,
        padding: '24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: '#f8fafc',
            }}
          >
            🏆 Student Leaderboard
          </h2>

          <p
            style={{
              color: '#64748b',
              marginTop: 6,
              fontSize: 14,
            }}
          >
            Compete with students and climb the rankings.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid #7c3aed',
            color: '#c4b5fd',
            padding: '10px 16px',
            borderRadius: 12,
            fontWeight: 700,
          }}
        >
          Your Rank: {currentRank || '—'}
        </div>
      </div>

      {leaderboardLoading ? (
        <div style={{ color: '#94a3b8' }}>Loading leaderboard…</div>
      ) : sorted.length === 0 ? (
        <div style={{ color: '#94a3b8' }}>No leaderboard data yet.</div>
      ) : (
        sorted.map((student, index) => {
          const rank = index + 1;
          const isCurrentUser =
            student._id === currentUserId || student.id === currentUserId;

          return (
            <div
              key={student._id ?? student.id ?? rank}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                borderRadius: 14,
                marginBottom: 10,
                background: isCurrentUser ? 'rgba(124,58,237,0.12)' : '#0f172a',
                border: isCurrentUser
                  ? '1px solid #7c3aed'
                  : '1px solid #1e293b',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#fff',
                    background:
                      rank === 1
                        ? '#eab308'
                        : rank === 2
                          ? '#94a3b8'
                          : rank === 3
                            ? '#d97706'
                            : '#334155',
                  }}
                >
                  {rank}
                </div>

                <div>
                  <p
                    style={{
                      margin: 0,
                      color: '#f8fafc',
                      fontWeight: 700,
                    }}
                  >
                    {student.name}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      color: '#64748b',
                      fontSize: 12,
                    }}
                  >
                    Student
                  </p>
                </div>
              </div>

              <div
                style={{
                  color: '#22d3ee',
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {student.score ?? 0} pts
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default LeaderBoard;
