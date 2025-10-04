import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { db } from "./firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  increment,
  deleteDoc,
} from "firebase/firestore";

function App() {
  const audioRef = useRef(null);

  const [page, setPage] = useState("memes");
  const [memes, setMemes] = useState([]);
  const [xp, setXpRaw] = useState(() => {
    const saved = localStorage.getItem("xp");
    return saved ? Number(saved) : 0;
  });
  const [popup, setPopup] = useState(null);
  const [quizState, setQuizState] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [captionInput, setCaptionInput] = useState("");
  const [userId, setUserId] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [playPhonk, setPlayPhonk] = useState(false);

  const modifyXp = (delta) =>
    setXpRaw((prev) => Math.max(0, Math.min(200, prev + delta)));

  const quizQuestionsData = [
    {
      q: "Who is Keonehon?",
      correct: "All of the above… and maybe more 🤯",
      wrong: ["Human CEO 😎", "Meme overlord of Monad 🖼️", "Secret alien strategist 👽"],
    },
    {
      q: "Who is BillMonday?",
      correct: "Human who hates Mondays 😅",
      wrong: [
        "Secretly a coffee-powered AI ☕🤖",
        "Alien visiting Earth only on Mondays 👽",
        "The guy who makes every Monday feel like Friday… eventually 😎",
      ],
    },
    {
      q: "Who is Mikeweb?",
      correct: "AI in disguise 🤖",
      wrong: ["Human", "Alien from another server 👽", "The one who actually runs Discord while we sleep 😎"],
    },
    { q: "What is Monad primarily known for?", correct: "Layer 1 blockchain", wrong: ["Smart contracts", "Gaming engine", "AI framework"] },
    { q: "Monad focuses on which key feature?", correct: "Parallel execution", wrong: ["Privacy coins", "Cross-chain swaps", "NFTs"] },
    { q: "Transaction finality in Monad is?", correct: "Seconds", wrong: ["Minutes", "Hours", "Instant"] },
    { q: "Monad is built for?", correct: "Scalability", wrong: ["Mining", "Stablecoins", "Private payments"] },
    { q: "What is Monad’s consensus mechanism?", correct: "Proof of Stake", wrong: ["Proof of Work", "Hybrid", "Delegated Proof"] },
    { q: "Monad is compatible with?", correct: "EVM", wrong: ["Bitcoin scripts", "Cosmos SDK", "Rust only"] },
    { q: "Which year was Monad announced?", correct: "2023", wrong: ["2021", "2020", "2022"] },
    { q: "Monad aims to handle how many TPS?", correct: "50,000+", wrong: ["10,000+", "500", "1,000"] },
    { q: "Monad team mainly from?", correct: "Jump Trading", wrong: ["Coinbase", "Binance", "Polygon"] },
    { q: "Monad uses what to speed up?", correct: "Parallel execution", wrong: ["Shard chains", "Sidechains", "Rollups"] },
    { q: "Monad primarily focuses on?", correct: "High throughput", wrong: ["Privacy tokens", "Stablecoins", "Yield farming"] },
    { q: "Which programming language is mainly used in Monad?", correct: "Rust", wrong: ["Python", "Solidity", "C++"] },
    { q: "Monad supports which kind of smart contracts?", correct: "EVM-compatible", wrong: ["Bitcoin Script", "Move", "Scilla"] },
    { q: "Monad’s parallel execution helps in?", correct: "Faster transactions", wrong: ["Lower fees", "Higher mining rewards", "NFT minting"] },
    { q: "Monad ecosystem mainly targets?", correct: "DeFi and Web3 apps", wrong: ["Only gaming", "Only NFTs", "Centralized apps"] },
  ];

  function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  useEffect(() => {
    let uid = localStorage.getItem("userId");
    if (!uid) {
      uid = Date.now() + "_" + Math.floor(Math.random() * 1000);
      localStorage.setItem("userId", uid);
    }
    setUserId(uid);
  }, []);

  useEffect(() => {
    localStorage.setItem("xp", xp);
  }, [xp]);

  // Real-time fetch of memes from Firestore so memes appear on refresh
  useEffect(() => {
    const q = query(collection(db, "memes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMemes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (page !== "quiz") return;
    const savedQuestions = localStorage.getItem("quizQuestions");
    if (savedQuestions) {
      setQuizQuestions(JSON.parse(savedQuestions));
    } else {
      const prepared = quizQuestionsData.map((q) => {
        const options = shuffleArray([q.correct, ...q.wrong]);
        const answer = options.indexOf(q.correct);
        return { ...q, options, answer };
      });
      setQuizQuestions(prepared);
      localStorage.setItem("quizQuestions", JSON.stringify(prepared));
    }
  }, [page]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };
  const handleDragOver = (e) => e.preventDefault();

  const handlePostMeme = async () => {
    if (!selectedImage) return;
    await addDoc(collection(db, "memes"), {
      ownerId: userId,
      image: selectedImage,
      caption: captionInput.trim() || "",
      reactions: { "😂": 0, "🔥": 0, "🤣": 0, "❤️": 0 },
      createdAt: Date.now(),
    });
    setCaptionInput("");
    setTimeout(() => setSelectedImage(null), 50);
  };

  const addReaction = async (id, emoji) => {
    const memeDoc = doc(db, "memes", id);
    await updateDoc(memeDoc, {
      [`reactions.${emoji}`]: increment(1),
    });
    setMemes((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              reactions: { ...m.reactions, [emoji]: (m.reactions[emoji] || 0) + 1 },
              highlightedReaction: emoji,
            }
          : m
      )
    );
    setTimeout(() => {
      setMemes((prev) =>
        prev.map((m) => (m.id === id ? { ...m, highlightedReaction: null } : m))
      );
    }, 700);
  };

  const deleteMeme = async (id, ownerId) => {
    if (ownerId !== userId) return;
    if (window.confirm("Are you sure you want to delete this meme? 😭")) {
      await deleteDoc(doc(db, "memes", id));
    }
  };

  const handleAnswer = (qIndex, clickedIdx) => {
    if (quizState[qIndex]?.answered) return;
    const correctIndex = quizQuestions[qIndex].answer;
    const isCorrect = clickedIdx === correctIndex;

    setQuizState((prev) => ({
      ...prev,
      [qIndex]: { answered: true, clicked: clickedIdx, correctIndex },
    }));

    if (isCorrect) modifyXp(10);
    else modifyXp(-10);

    showPopup(isCorrect ? "Good! +10 XP 🟢" : "Whooops! -10 XP 🔴", isCorrect ? "green" : "red");
  };

  const showPopup = (text, color) => {
    setPopup({ text, color });
    setTimeout(() => setPopup(null), 1500);
  };

  const handleMemesClick = () => setPage("memes");
  const handleQuizClick = () => {
    localStorage.removeItem("quizQuestions");
    setQuizState({});
    setPage("quiz");
  };

  const togglePhonk = () => {
    if (audioRef.current) {
      if (playPhonk) audioRef.current.pause();
      else audioRef.current.play();
    }
    setPlayPhonk(!playPhonk);
  };

  return (
    <div className="app-container">
      <h1>{page === "memes" ? "Monad Meme Hub 🎉" : "Monad Quiz Hub 🧠"}</h1>

      <div className="nav-buttons">
        <button onClick={handleMemesClick} className={page === "memes" ? "active-btn" : ""}>
          Memes
        </button>
        <button onClick={handleQuizClick} className={page === "quiz" ? "active-btn" : ""}>
          Quiz
        </button>
        <button
          onClick={togglePhonk}
          style={{ background: "#ff4d6d", color: "white", padding: "5px 10px", borderRadius: "8px", fontWeight: "bold" }}
        >
          {playPhonk ? "Pause Phonk ⏸" : "Play Phonk 🎵"}
        </button>
      </div>

      <audio ref={audioRef} src="/ACELERADA.mp3" loop />

      {popup && <div className={`popup ${popup.color}`}>{popup.text}</div>}

      {page === "memes" && (
        <div className="memes-container">
          <div className="meme-post" onDrop={handleDrop} onDragOver={handleDragOver}>
            {selectedImage && <img src={selectedImage} className="meme-preview" alt="preview" />}
            <input
              type="text"
              placeholder="Type your legendary meme caption here 😂"
              value={captionInput}
              onChange={(e) => setCaptionInput(e.target.value)}
              className="caption-input"
            />
            <div className="file-buttons">
              <label htmlFor="fileUpload" className="file-label">
                Select Image
              </label>
              <input id="fileUpload" type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
              {selectedImage && (
                <button onClick={handlePostMeme} className="post-btn">
                  Post Meme
                </button>
              )}
            </div>
          </div>

          {memes.map((m) => (
            <div key={m.id} className="meme-card">
              <img src={m.image} className="meme-img" alt="meme" />
              {m.caption && <p className="meme-caption">{m.caption}</p>}
              <div className="meme-actions">
                {Object.keys(m.reactions).map((e) => (
                  <button
                    key={e}
                    onClick={() => addReaction(m.id, e)}
                    className={`reaction-btn ${m.highlightedReaction === e ? "reaction-highlight" : ""}`}
                  >
                    {e} <span className="count-text">{m.reactions[e]}</span>
                  </button>
                ))}
                {m.ownerId === userId && (
                  <button onClick={() => deleteMeme(m.id, m.ownerId)} className="delete-btn" style={{ opacity: 0.8, fontSize: "0.85rem" }}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {page === "quiz" && (
        <div className="quiz-container">
          <h3 className="xp-display">XP: {xp}</h3>
          {quizQuestions.map((q, i) => (
            <div key={i} className="quiz-card">
              <p className="quiz-question">{q.q}</p>
              {q.options.map((opt, idx) => {
                let className = "quiz-btn";
                const answered = quizState[i]?.answered;
                const clicked = quizState[i]?.clicked;
                const correctIdx = q.answer;

                if (answered) {
                  if (idx === correctIdx) className += " correct-glow";
                  if (clicked === idx && clicked !== correctIdx) className += " wrong-glow";
                }

                return (
                  <button key={idx} className={className} disabled={answered} onClick={() => handleAnswer(i, idx)}>
                    {opt}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <footer className="app-footer">
        Created by{" "}
        <a href="https://discord.com/users/saiff_btx" target="_blank" rel="noopener noreferrer">
          Saif 🚀 | Discord: saiff_btx
        </a>{" "}
        |{" "}
        <a href="https://x.com/Saif_btx?t=Q-ONqoHPrnL6aNXAZrvlDg&s=09" target="_blank" rel="noopener noreferrer">
          X: saif-btx
        </a>{" "}
        <br />
        Memes included for free
      </footer>
    </div>
  );
}

export default App;
