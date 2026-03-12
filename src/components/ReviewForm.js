import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import { useAuth } from "../app/authContext";
import styles from "./ReviewForm.module.css";

const STAR_VALUES = [1, 2, 3, 4, 5];

function sanitizeHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  const allowed = new Set(["B", "I", "U", "S", "BR", "UL", "OL", "LI"]);

  const walk = (node) => {
    [...node.children].forEach((el) => {
      if (!allowed.has(el.tagName)) {
        const parent = el.parentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      } else {
        walk(el);
      }
    });
  };

  walk(tmp);
  return tmp.innerHTML;
}

function StarRating({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  const displayValue = hovered || value || 0;

  return (
    <div className={styles.starRating}>
      <div className={styles.starRow} onMouseLeave={() => setHovered(0)}>
        {STAR_VALUES.map((star) => {
          const active = star <= displayValue;
          return (
            <button
              key={star}
              type="button"
              className={`${styles.starBtn} ${active ? styles.starBtnOn : ""}`}
              onMouseEnter={() => !disabled && setHovered(star)}
              onFocus={() => !disabled && setHovered(star)}
              onClick={() => !disabled && onChange(star)}
              disabled={disabled}
              aria-label={`${star}점`}
              title={`${star}점`}
            >
              ★
            </button>
          );
        })}
      </div>

      <div className={styles.starScore}>{Number(value || 0).toFixed(1)}</div>
    </div>
  );
}

export default function ReviewForm({ onSubmit, itemMeta }) {
  const navigate = useNavigate();
  const { user, isAuthed } = useAuth();

  const [rating, setRating] = useState(5);
  const [plain, setPlain] = useState("");
  const [html, setHtml] = useState("");

  const editorRef = useRef(null);

  const canSubmit = useMemo(() => {
    return isAuthed && plain.trim().length >= 3;
  }, [isAuthed, plain]);

  const exec = (cmd) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    try {
      document.execCommand(cmd);
    } catch {}
    const h = sanitizeHtml(editorRef.current.innerHTML);
    setHtml(h);
    setPlain(editorRef.current.innerText || "");
  };

  const onInput = () => {
    if (!editorRef.current) return;
    const h = sanitizeHtml(editorRef.current.innerHTML);
    setHtml(h);
    setPlain(editorRef.current.innerText || "");
  };

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;

        onSubmit({
          author: user.nickname,
          rating,
          content: plain,
          contentHtml: html,
          itemMeta,
        });

        setPlain("");
        setHtml("");
        setRating(5);
        if (editorRef.current) editorRef.current.innerHTML = "";
      }}
    >
      <div className={styles.topArea}>
        <div className={styles.leftMeta}>
          <div className={styles.label}>닉네임</div>
          <div className={styles.readonly}>
            {isAuthed ? user.nickname : "로그인이 필요힙니다."}
          </div>
        </div>

        <div className={styles.rightMeta}>
          <div className={styles.labelLarge}>별점</div>
          <StarRating value={rating} onChange={setRating} disabled={!isAuthed} />
          <div className={styles.starHint}>별점을 클릭해 주세요.</div>
        </div>
      </div>

      {!isAuthed && (
        <div className={styles.loginHint}>
          리뷰를 남기려면{" "}
          <button
            type="button"
            className={styles.loginLink}
            onClick={() => navigate("/login")}
          >
            로그인
          </button>{" "}
          해주세요.
        </div>
      )}

      <div className={styles.editorWrap}>
        <div
          className={styles.editor}
          ref={editorRef}
          contentEditable={isAuthed}
          suppressContentEditableWarning
          onInput={onInput}
          data-placeholder={
            isAuthed ? "Enter your message here..." : "로그인 후 작성할 수 있어요."
          }
          aria-label="리뷰 입력"
        />
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => exec("insertUnorderedList")}
            disabled={!isAuthed}
            title="List"
          >
            ≡
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => exec("insertOrderedList")}
            disabled={!isAuthed}
            title="Number"
          >
            ≣
          </button>
          <span className={styles.toolSep} />
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => exec("bold")}
            disabled={!isAuthed}
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => exec("italic")}
            disabled={!isAuthed}
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => exec("underline")}
            disabled={!isAuthed}
            title="Underline"
          >
            U
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => exec("strikeThrough")}
            disabled={!isAuthed}
            title="Strike"
          >
            S
          </button>

          <div className={styles.sendWrap}>
            <Button type="submit" disabled={!canSubmit}>
              Send
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.hintLine}>
        {canSubmit ? "등록할 준비됨" : isAuthed ? "3글자 이상 입력해 주세요." : "로그인이 필요합니다."}
      </div>
    </form>
  );
}