"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { calmPlan, rushPlan, webPlan } from '@/plans';

const LS_PLAN_KEY = 'ccr.plan';

export default function ProjectDescription() {
  const [plan, setPlan] = useState<string>('Rush');

  useEffect(() => {
    try {
      const v = localStorage.getItem(LS_PLAN_KEY);
      if (v) setPlan(v);
    } catch {}
  }, []);

  const desc = useMemo(() => {
    const map: Record<string, { description?: string }> = {
      Calm: calmPlan,
      Rush: rushPlan,
      Web: webPlan,
    };
    const p = map[plan] || rushPlan;
    return p.description || 'Agent Control Traffic Control';
  }, [plan]);

  return <span>{desc}</span>;
}

