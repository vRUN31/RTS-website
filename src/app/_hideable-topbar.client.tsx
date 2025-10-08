"use client";
import React from "react";
import TopBar from "./_topbar.client";

export default function HideableTopBar() {
  const [show, setShow] = React.useState(true);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setShow(!(path.startsWith("/login") || path.startsWith("/register")));
    }
  }, []);
  if (!show) return null;
  return <TopBar />;
}