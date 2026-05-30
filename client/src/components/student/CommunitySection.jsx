import React, { useState } from "react"

const COMMUNITY_POSTS = {
  "Sarah Chen's Circle": [
    { id: 1, author: "Sarah Chen", init: "SC", color: "#db2777", role: "instructor", tag: "AMA", tagColor: "#0f6e56", tagBg: "#e1f5ee", time: "1h ago", upvotes: 142, replies: 34, text: "🎙 AMA: Ask me anything about breaking into Web Dev! I'll be answering questions for the next hour.", pinned: true },
    { id: 2, author: "Mia Johnson", init: "MJ", color: "#7c3aed", role: "student", tag: "Question", tagColor: "#1a6bbf", tagBg: "#e3f0fd", time: "3h ago", upvotes: 24, replies: 12, text: "How do I properly handle async/await errors in Node.js? I keep getting unhandled promise rejections." },
    { id: 3, author: "Leo Chen", init: "LC", color: "#0f6e56", role: "student", tag: "Showcase", tagColor: "#0f6e56", tagBg: "#e1f5ee", time: "6h ago", upvotes: 67, replies: 8, text: "Just deployed my first full-stack app! React + Node + MongoDB. Check it out 🚀 github.com/leochen/myapp" },
  ],
  "Alex's AI Lab": [
    { id: 1, author: "Alex Kumar", init: "AK", color: "#7c3aed", role: "instructor", tag: "Resource", tagColor: "#854f0b", tagBg: "#faeeda", time: "2h ago", upvotes: 88, replies: 19, text: "📚 New resource drop: My curated list of the best papers on transformer architectures. Essential reading for the course!", pinned: true },
    { id: 2, author: "Raj Singh", init: "RS", color: "#854f0b", role: "student", tag: "Question", tagColor: "#1a6bbf", tagBg: "#e3f0fd", time: "5h ago", upvotes: 14, replies: 6, text: "Can someone explain the difference between supervised and self-supervised learning in simple terms?" },
  ],
  "Rae's Design Studio": [
    { id: 1, author: "Rae Johnson", init: "RJ", color: "#0f6e56", role: "instructor", tag: "Showcase", tagColor: "#0f6e56", tagBg: "#e1f5ee", time: "30m ago", upvotes: 55, replies: 10, text: "🎨 This week's design challenge: Redesign a checkout flow for better UX. Share your Figma links below!", pinned: true },
    { id: 2, author: "Sam Park", init: "SP", color: "#db2777", role: "student", tag: "Question", tagColor: "#1a6bbf", tagBg: "#e3f0fd", time: "2h ago", upvotes: 9, replies: 4, text: "What's the best way to present a UX case study for a junior designer portfolio?" },
  ],
}

const INITIAL_COMMUNITIES = [
  { name: "Sarah Chen's Circle",  members: 324, topic: "Web Dev",      init: "SC", color: "#db2777", joined: false },
  { name: "Alex's AI Lab",        members: 189, topic: "AI & ML",      init: "AK", color: "#7c3aed", joined: true  },
  { name: "Rae's Design Studio",  members: 241, topic: "UI/UX Design", init: "RJ", color: "#0f6e56", joined: false },
]

export default function Community() {
  const [communities, setCommunities]   = useState(INITIAL_COMMUNITIES)
  const [openCommunity, setOpenCommunity] = useState(
    INITIAL_COMMUNITIES.find(c => c.joined)?.name || null
  )
  const [postsByComm, setPostsByComm]   = useState(COMMUNITY_POSTS)
  const [upvoted, setUpvoted]           = useState({})
  const [newPost, setNewPost]           = useState("")
  const [showForm, setShowForm]         = useState(false)
  const [catFilter, setCatFilter]       = useState("All")

  const categories = ["All", "Question", "Showcase", "AMA", "Resource"]

  const activeCommunity = communities.find(c => c.name === openCommunity)
  const rawPosts = openCommunity ? (postsByComm[openCommunity] || []) : []
  const posts = rawPosts.filter(p => catFilter === "All" || p.tag === catFilter)

  const handleJoin = (idx) => {
    const comm = communities[idx]
    if (comm.joined) {
      // Leave
      setCommunities(prev => prev.map((c, i) =>
        i === idx ? { ...c, joined: false, members: c.members - 1 } : c
      ))
      if (openCommunity === comm.name) setOpenCommunity(null)
    } else {
      // Join and open
      setCommunities(prev => prev.map((c, i) =>
        i === idx ? { ...c, joined: true, members: c.members + 1 } : c
      ))
      setOpenCommunity(comm.name)
      setCatFilter("All")
      setShowForm(false)
    }
  }

  const handleOpen = (name) => {
    setOpenCommunity(name)
    setCatFilter("All")
    setShowForm(false)
  }

  const handlePost = () => {
    if (!newPost.trim() || !openCommunity) return
    const post = {
      id: Date.now(), author: "You", init: "Y", color: "#7c3aed",
      role: "student", tag: "Question", tagColor: "#1a6bbf", tagBg: "#e3f0fd",
      time: "Just now", upvotes: 0, replies: 0, text: newPost,
    }
    setPostsByComm(prev => ({
      ...prev,
      [openCommunity]: [post, ...(prev[openCommunity] || [])],
    }))
    setNewPost("")
    setShowForm(false)
  }

  const toggleUpvote = (id) => {
    const key = `${openCommunity}-${id}`
    const wasUpvoted = upvoted[key]
    setUpvoted(prev => ({ ...prev, [key]: !wasUpvoted }))
    setPostsByComm(prev => ({
      ...prev,
      [openCommunity]: prev[openCommunity].map(p =>
        p.id === id ? { ...p, upvotes: p.upvotes + (wasUpvoted ? -1 : 1) } : p
      ),
    }))
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>Instructor Communities</h2>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          Join a private community when you subscribe to an instructor
        </p>
      </div>

      {/* Community cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {communities.map((c, idx) => (
          <div
            key={c.name}
            style={{
              background: "#111827",
              border: `1px solid ${openCommunity === c.name ? c.color : c.joined ? "#334155" : "#1e293b"}`,
              borderRadius: 16,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              transition: "border-color 0.2s",
            }}
          >
            <div
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: c.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}
            >
              {c.init}
            </div>

            <div
              style={{ flex: 1, cursor: c.joined ? "pointer" : "default" }}
              onClick={() => c.joined && handleOpen(c.name)}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
                {c.name}
                {openCommunity === c.name && (
                  <span style={{ fontSize: 10, background: "#1e1040", color: "#a78bfa", padding: "2px 7px", borderRadius: 20, fontWeight: 600 }}>
                    OPEN
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {c.members} members · {c.topic}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {c.joined && openCommunity !== c.name && (
                <button
                  onClick={() => handleOpen(c.name)}
                  style={{
                    padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                    border: "1px solid #334155", background: "transparent", color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  Open
                </button>
              )}
              <button
                onClick={() => handleJoin(idx)}
                style={{
                  padding: "7px 16px", borderRadius: 10, border: "none",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  background: c.joined ? "#052e16" : "#7c3aed",
                  color: c.joined ? "#4ade80" : "#fff",
                  transition: "all 0.2s",
                }}
              >
                {c.joined ? "✓ Joined" : "Join"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Community forum panel */}
      {openCommunity && activeCommunity && (
        <div style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: 20,
          padding: "20px 20px",
          marginTop: 4,
        }}>
          {/* Forum header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: activeCommunity.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "#fff",
              }}>
                {activeCommunity.init}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>{activeCommunity.name}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{activeCommunity.members} members · {activeCommunity.topic}</div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(s => !s)}
              style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                border: "none", borderRadius: 12,
                color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              + New Post
            </button>
          </div>

          {/* New post form */}
          {showForm && (
            <div style={{ background: "#111827", border: "1px solid #334155", borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <textarea
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                placeholder={`Share something in ${openCommunity}...`}
                rows={3}
                style={{
                  width: "100%", background: "#1e293b", border: "1px solid #334155",
                  borderRadius: 10, padding: "10px 14px", color: "#f1f5f9",
                  fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                <button onClick={() => setShowForm(false)} style={{ padding: "7px 14px", border: "1px solid #334155", background: "transparent", color: "#94a3b8", borderRadius: 10, fontSize: 12, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handlePost} style={{ padding: "7px 16px", background: "#7c3aed", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Category filter */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                style={{
                  fontSize: 11, padding: "4px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                  background: catFilter === cat ? "#7c3aed" : "#1e293b",
                  color: catFilter === cat ? "#fff" : "#64748b",
                  fontWeight: 600, transition: "all 0.15s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {posts.length === 0 ? (
              <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
                No posts yet. Be the first to post!
              </p>
            ) : posts.map(post => {
              const upKey = `${openCommunity}-${post.id}`
              return (
                <div
                  key={post.id}
                  style={{
                    background: "#111827",
                    border: `1px solid ${post.pinned ? "#7c3aed" : "#1e293b"}`,
                    borderRadius: 14, padding: "14px 16px",
                  }}
                >
                  {post.pinned && (
                    <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, marginBottom: 8 }}>📌 PINNED</div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", background: post.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
                    }}>
                      {post.init}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{post.author}</span>
                        {post.role === "instructor" && (
                          <span style={{ fontSize: 10, background: "#2e1065", color: "#a78bfa", padding: "1px 6px", borderRadius: 20, fontWeight: 600 }}>
                            Instructor
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{post.time}</span>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: post.tagBg, color: post.tagColor,
                    }}>
                      {post.tag}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 12 }}>{post.text}</p>

                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button
                      onClick={() => toggleUpvote(post.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "transparent", border: "none", cursor: "pointer",
                        color: upvoted[upKey] ? "#a78bfa" : "#64748b",
                        fontSize: 13, fontWeight: 600,
                      }}
                    >
                      ▲ {post.upvotes}
                    </button>
                    <button style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13 }}>
                      💬 {post.replies} replies
                    </button>
                    <button style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13 }}>
                      🔗 Share
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}