"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { getPlanByName, ALL_PLANS, DEFAULT_PLAN_NAME } from '@/plans';

const LS_PLAN_KEY = 'ccr.plan';

export default function ProjectDescription() {
  const [plan, setPlan] = useState<string>(DEFAULT_PLAN_NAME);

  useEffect(() => {
    try {
      const v = localStorage.getItem(LS_PLAN_KEY);
      if (v) setPlan(v);
    } catch {}
  }, []);

  const desc = useMemo(() => {
    const p = getPlanByName(plan) || ALL_PLANS[0];
    return p.description || 'Agent Control Traffic Control';
  }, [plan]);

  return <span>{desc}</span>;
}
