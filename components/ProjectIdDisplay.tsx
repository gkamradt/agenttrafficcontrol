"use client";

import React, { useEffect, useState } from 'react';

// Mirrors LS key used in ControlBar
const LS_PLAN_KEY = 'ccr.plan';

export default function ProjectIdDisplay() {
  const [plan, setPlan] = useState<string>('Rush');

  useEffect(() => {
    try {
      const v = localStorage.getItem(LS_PLAN_KEY);
      if (v) setPlan(v);
    } catch {}
  }, []);

  return <span>{plan}</span>;
}
