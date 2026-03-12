import React from "react";
import styles from "./Button.module.css";

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
    />
  );
}
