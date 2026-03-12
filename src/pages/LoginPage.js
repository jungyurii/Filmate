import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { useAuth } from "../app/authContext";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [nickname, setNickname] = useState("");

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.title}>로그인</div>
        <div className={styles.sub}>닉네임을 설정해 주세요.</div>

        <label className={styles.label}>
          닉네임
          <input
            className={styles.input}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력하세요."
            maxLength={20}
          />
        </label>

        <div className={styles.actions}>
          <Button
            size="lg"
            onClick={() => {
              login(nickname);
              nav(-1);
            }}
          >
            시작하기
          </Button>
        </div>
      </div>
    </div>
  );
}
