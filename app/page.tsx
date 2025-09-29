'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Calculator,
  TrendingUp,
  Share2,
  Target,
  Calendar,
  DollarSign,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Results = {
  months: number;
  completionDate: Date;
  totalContributions: number;
  totalGrowth: number;
  monthlySeries: { date: string; value: number }[];
  percentComplete?: number;
};

type Mode = 'forward' | 'reverse' | 'debt';

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function money(num: number) {
  return num.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function Page() {
  // UI / app state
  const [mode, setMode] = useState<Mode>('forward');
  const [dark, setDark] = useState<boolean>(false);

  // Goal input state (used in forward & reverse)
  const [goalName, setGoalName] = useState('My Goal');
  const [goalAmount, setGoalAmount] = useState<number>(10000);
  const [currentAmount, setCurrentAmount] = useState<number>(1000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(200);
  const [annualGrowth, setAnnualGrowth] = useState<number>(0.05); // 5%
  const [useGrowth, setUseGrowth] = useState<boolean>(true);

  // Reverse-mode: target date
  const [targetDate, setTargetDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });

  // Debt mode inputs
  const [debtBalance, setDebtBalance] = useState<number>(5000);
  const [debtInterest, setDebtInterest] = useState<number>(0.18); // 18% APR
  const [debtMonthly, setDebtMonthly] = useState<number>(150);
  const [debtExtra, setDebtExtra] = useState<number>(0);

  // Results
  const [results, setResults] = useState<Results | null>(null);

  // UI refs for share image
  const shareRef = useRef<HTMLDivElement | null>(null);

  // Accessibility: focus main when mode changes
  useEffect(() => {
    const el = document.getElementById('main-heading');
    el?.focus();
  }, [mode]);

  // Theme toggle: apply to html body class if you want global effect
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }
  }, [dark]);

  // Calculation helpers
  function computeForward(): Results {
    // If no growth or growth disabled, treat as simple linear contributions
    const monthlyRate = useGrowth ? Math.pow(1 + annualGrowth, 1 / 12) - 1 : 0;
    let balance = currentAmount;
    const monthlySeries: { date: string; value: number }[] = [];
    let months = 0;

    // Safety cap: avoid infinite loop
    const cap = 1200; // 100 years granularity
    while (balance < goalAmount && months < cap) {
      months++;
      // contribution first
      balance += monthlyContribution;
      // then growth
      if (monthlyRate > 0) {
        balance = balance * (1 + monthlyRate);
      }
      const d = addMonths(new Date(), months);
      monthlySeries.push({ date: formatDate(d), value: Math.max(0, Math.round(balance)) });
    }
    const completionDate = addMonths(new Date(), months);
    const totalContributions = currentAmount + monthlyContribution * months;
    const totalGrowth = Math.max(0, Math.round((monthlySeries.length ? monthlySeries[monthlySeries.length - 1].value : balance) - totalContributions));
    const percentComplete = Math.min(100, Math.round((currentAmount / goalAmount) * 100));
    return {
      months,
      completionDate,
      totalContributions,
      totalGrowth,
      monthlySeries,
      percentComplete,
    };
  }

  function computeReverse(): Results {
    const target = new Date(targetDate);
    if (isNaN(target.getTime())) {
      // fallback to forward if invalid
      return computeForward();
    }
    // months between now and target:
    const now = new Date();
    const monthsDiff = Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
    // handle same month -> 0 => treat as 1 month
    const months = Math.max(1, monthsDiff);
    // compute needed monthly contribution to reach goal given growth and current
    const monthlyRate = useGrowth ? Math.pow(1 + annualGrowth, 1 / 12) - 1 : 0;
    // future value formula for series contributions:
    // FV = current * (1+r)^n + PMT * [((1+r)^n -1)/r] * (1+r)   (using contribution at beginning/end conventions; we'll use contribution at start of period)
    // Solve for PMT:
    // PMT = (FV - current*(1+r)^n) * r / [((1+r)^n -1)]
    const fv = goalAmount;
    const cur = currentAmount;
    const r = monthlyRate;
    const n = months;
    let required = 0;
    if (r === 0) {
      required = Math.max(0, Math.ceil((fv - cur) / n));
    } else {
      const factor = Math.pow(1 + r, n);
      required = Math.max(0, Math.ceil(((fv - cur * factor) * r) / (factor - 1)));
    }

    // Build monthly series using the computed required contribution
    let balance = currentAmount;
    const monthlySeries: { date: string; value: number }[] = [];
    for (let m = 1; m <= months; m++) {
      balance += required;
      if (r > 0) balance = balance * (1 + r);
      monthlySeries.push({ date: formatDate(addMonths(new Date(), m)), value: Math.round(balance) });
    }
    const totalContributions = currentAmount + required * months;
    const totalGrowth = Math.max(0, Math.round((monthlySeries.length ? monthlySeries[monthlySeries.length - 1].value : balance) - totalContributions));
    return {
      months,
      completionDate: addMonths(new Date(), months),
      totalContributions,
      totalGrowth,
      monthlySeries,
      percentComplete: Math.min(100, Math.round((currentAmount / goalAmount) * 100)),
    };
  }

  function computeDebt(): Results {
    // Debt payoff using amortization steps. Extra payment included.
    const monthlyRate = debtInterest / 12;
    let balance = debtBalance;
    const monthlySeries: { date: string; value: number }[] = [];
    let months = 0;
    const cap = 600; // 50 years
    while (balance > 0.5 && months < cap) {
      months++;
      // interest accrues
      const interest = balance * monthlyRate;
      balance += interest;
      // payment
      const payment = Math.min(balance, debtMonthly + debtExtra);
      balance -= payment;
      monthlySeries.push({ date: formatDate(addMonths(new Date(), months)), value: Math.round(Math.max(0, balance)) });
      // safety break if payment does not cover interest (avoid infinite loop)
      if (payment <= interest && balance > 0) {
        // make a forced payment increase
        balance -= 0.0001;
      }
    }
    const completionDate = addMonths(new Date(), months);
    const totalContributions = (debtMonthly + debtExtra) * months;
    const totalGrowth = Math.round(Math.max(0, (debtBalance - (monthlySeries.length ? monthlySeries[monthlySeries.length - 1].value : 0))));
    const percentComplete = Math.min(100, Math.round(((debtBalance - (monthlySeries.length ? monthlySeries[monthlySeries.length - 1].value : 0)) / debtBalance) * 100));
    return {
      months,
      completionDate,
      totalContributions,
      totalGrowth,
      monthlySeries,
      percentComplete,
    };
  }

  // Main compute entry
  function calculate() {
    try {
      if (mode === 'forward') {
        setResults(computeForward());
      } else if (mode === 'reverse') {
        setResults(computeReverse());
      } else {
        setResults(computeDebt());
      }
    } catch (e) {
      console.error('Calculation error', e);
      setResults(null);
    }
  }

  // When inputs change, update quickly (debounce would be nicer but keep simple)
  useEffect(() => {
    // small auto-calc so demo is smooth
    calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, goalAmount, currentAmount, monthlyContribution, annualGrowth, useGrowth, targetDate, debtBalance, debtInterest, debtMonthly, debtExtra]);

  // Shareable image generator (simple canvas)
  async function generateShareImage() {
    if (!shareRef.current || !results) return;
    const el = shareRef.current;
    // compute size
    const width = 1200;
    const height = 630;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // background
    if (dark) {
      ctx.fillStyle = '#0f172a'; // slate-900
    } else {
      ctx.fillStyle = '#ffffff';
    }
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = dark ? '#e6eef8' : '#0b1b2b';
    ctx.font = 'bold 48px Inter, Arial, sans-serif';
    ctx.fillText(goalName, 60, 100);

    // Subtitle info
    ctx.font = '28px Inter, Arial, sans-serif';
    ctx.fillText(`Completion: ${formatDate(results.completionDate)}`, 60, 160);
    ctx.fillText(`Time: ${results.months} months`, 60, 200);

    // Progress bar
    const progress = results.percentComplete ?? 0;
    const barX = 60;
    const barY = 240;
    const barW = 1080;
    const barH = 40;
    // background bar
    ctx.fillStyle = dark ? '#1f2937' : '#e6eef8';
    ctx.fillRect(barX, barY, barW, barH);
    // fill
    ctx.fillStyle = '#0ea5a4'; // teal-400
    ctx.fillRect(barX, barY, (progress / 100) * barW, barH);
    ctx.font = '22px Inter, Arial, sans-serif';
    ctx.fillStyle = dark ? '#e6eef8' : '#0b1b2b';
    ctx.fillText(`${progress}% complete`, barX + 10, barY + 30);

    // Small footer text
    ctx.font = '18px Inter, Arial, sans-serif';
    ctx.fillStyle = dark ? '#9aa7b3' : '#475569';
    ctx.fillText('Generated with GoalTrackr', 60, height - 40);

    // download
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${goalName.replace(/\s+/g, '_')}_progress.png`;
    a.click();
  }

  // Small helper for growth rate slider display
  function growthLabel(rate: number) {
    if (rate === 0) return '0% (No Growth)';
    return `${Math.round(rate * 100)}%`;
  }

  // small UI bits
  const primaryBtn = 'inline-flex items-center gap-2 px-4 py-2 rounded-md shadow-sm text-white';
  const primaryBg = dark ? 'bg-teal-500 hover:bg-teal-600' : 'bg-sky-600 hover:bg-sky-700';

  return (
    <main className={`min-h-screen py-8 ${dark ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-slate-900'} px-4`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-sky-500 to-teal-400 p-2 rounded-lg text-white">
              <Calculator size={28} />
            </div>
            <div>
              <h1 id="main-heading" tabIndex={-1} className="text-2xl font-bold">GoalTrackr</h1>
              <p className="text-sm text-slate-400">Plan your savings, pay off debt, and stay motivated.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDark(!dark)}
              title="Toggle theme"
              className={`p-2 rounded-md ${dark ? 'bg-slate-700 text-yellow-300' : 'bg-white text-slate-700 shadow-sm'}`}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => {
                // quick share trigger; copy link behavior: open share dialog? just copy URL
                if (typeof window !== 'undefined') {
                  navigator.clipboard?.writeText(window.location.href);
                  alert('Link copied to clipboard — share with friends!');
                }
              }}
              title="Copy link"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white text-slate-800 shadow-sm"
            >
              <Share2 size={16} /> Share
            </button>
          </div>
        </header>

        {/* Mode toggle */}
        <nav className="bg-transparent mb-6">
          <div className="flex gap-2">
            <button
              className={`flex-1 rounded-md p-3 text-left ${mode === 'forward' ? `${primaryBg} text-white` : `bg-white text-slate-700 shadow-sm`} `}
              onClick={() => setMode('forward')}
            >
              <div className="flex items-center gap-2"><TrendingUp size={16} /> Goal Calculator</div>
              <div className="text-xs text-slate-200/80">When will I reach my target?</div>
            </button>
            <button
              className={`flex-1 rounded-md p-3 text-left ${mode === 'reverse' ? `${primaryBg} text-white` : `bg-white text-slate-700 shadow-sm`} `}
              onClick={() => setMode('reverse')}
            >
              <div className="flex items-center gap-2"><Calendar size={16} /> Reverse Mode</div>
              <div className="text-xs text-slate-200/80">Set a date — find required monthly</div>
            </button>
            <button
              className={`flex-1 rounded-md p-3 text-left ${mode === 'debt' ? `${primaryBg} text-white` : `bg-white text-slate-700 shadow-sm`} `}
              onClick={() => setMode('debt')}
            >
              <div className="flex items-center gap-2"><DollarSign size={16} /> Debt Payoff</div>
              <div className="text-xs text-slate-200/80">See payoff date & interest</div>
            </button>
          </div>
        </nav>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left pane - inputs */}
          <div className="md:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
            {(mode === 'forward' || mode === 'reverse') && (
              <>
                <label className="block text-sm font-medium mb-1">Goal name</label>
                <input
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent"
                />

                <label className="block text-sm font-medium mt-3">Goal amount</label>
                <input
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(Number(e.target.value))}
                  className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent"
                />

                <label className="block text-sm font-medium mt-3">Current amount</label>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(Number(e.target.value))}
                  className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent"
                />

                <label className="block text-sm font-medium mt-3">Monthly contribution</label>
                <input
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent"
                />

                <div className="mt-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={useGrowth} onChange={(e) => setUseGrowth(e.target.checked)} />
                    <span>Apply annual growth rate</span>
                  </label>
                  <div className="mt-2 flex gap-2 items-center">
                    <input
                      type="range"
                      min={0}
                      max={0.2}
                      step={0.005}
                      value={annualGrowth}
                      onChange={(e) => setAnnualGrowth(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-sm w-20 text-right">{growthLabel(annualGrowth)}</div>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Examples: 0% (cash), 4% (HYSA), 7% (stocks)</div>
                </div>

                {mode === 'reverse' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Target completion date</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent"
                    />
                  </div>
                )}
              </>
            )}

            {mode === 'debt' && (
              <>
                <label className="block text-sm font-medium mb-1">Debt name</label>
                <input className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent" placeholder="Credit Card / Loan" />

                <label className="block text-sm font-medium mt-3">Balance</label>
                <input type="number" value={debtBalance} onChange={(e) => setDebtBalance(Number(e.target.value))} className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent" />

                <label className="block text-sm font-medium mt-3">Interest rate (APR)</label>
                <input type="number" step="0.01" value={debtInterest * 100} onChange={(e) => setDebtInterest(Number(e.target.value) / 100)} className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent" />

                <label className="block text-sm font-medium mt-3">Monthly minimum payment</label>
                <input type="number" value={debtMonthly} onChange={(e) => setDebtMonthly(Number(e.target.value))} className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent" />

                <label className="block text-sm font-medium mt-3">Extra monthly payment (optional)</label>
                <input type="number" value={debtExtra} onChange={(e) => setDebtExtra(Number(e.target.value))} className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent" />
              </>
            )}

            {/* Calculate + clear */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={calculate}
                className={`${primaryBtn} ${primaryBg}`}
              >
                <Sparkles size={16} /> Calculate
              </button>
              <button
                onClick={() => {
                  // simple reset to defaults
                  setGoalName('My Goal');
                  setGoalAmount(10000);
                  setCurrentAmount(1000);
                  setMonthlyContribution(200);
                  setAnnualGrowth(0.05);
                  setUseGrowth(true);
                  setTargetDate(new Date().toISOString().slice(0, 10));
                  setDebtBalance(5000);
                  setDebtInterest(0.18);
                  setDebtMonthly(150);
                  setDebtExtra(0);
                  setResults(null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white text-slate-700 shadow-sm"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Right pane - results + chart */}
          <div className="md:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
            {!results && (
              <div className="p-6 text-center text-slate-500">
                <p>Enter values and click Calculate to see results.</p>
              </div>
            )}

            {results && (
              <div>
                {/* Top summary */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{mode === 'debt' ? 'Debt Summary' : goalName}</h2>
                    <div className="text-sm text-slate-400">
                      {mode === 'debt' ? `Remaining balance timeline` : `Estimated completion: ${formatDate(results.completionDate)} • ${results.months} months`}
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    <div className="text-right">
                      <div className="text-sm text-slate-400">Total contributions</div>
                      <div className="font-medium">{mode === 'debt' ? money(results.totalContributions) : money(results.totalContributions)}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={generateShareImage} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100">
                        <Share2 size={16} /> Download Share Image
                      </button>
                    </div>
                  </div>
                </div>

                {/* Motivational message + progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-slate-400">Progress</div>
                      <div className="mt-1 text-lg font-semibold">{results.percentComplete ?? 0}%</div>
                      <div className="text-xs text-slate-400"> {mode === 'debt' ? 'Amount remaining' : `Goal progress based on current balance`}</div>
                    </div>
                    <div className="flex-1">
                      {/* progress bar */}
                      <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div className="h-4 rounded-full bg-teal-400" style={{ width: `${results.percentComplete ?? 0}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-slate-500">
                    {mode === 'debt' ? (
                      <>
                        {results.months <= 1 ? (
                          <span>You're almost done — one final payment left. Great work!</span>
                        ) : (
                          <span>At your current payments, you'll be debt-free in {results.months} months ({formatDate(results.completionDate)}).</span>
                        )}
                      </>
                    ) : (
                      <>
                        {results.months <= 3 ? (
                          <span>You're so close! A small boost can get you there faster.</span>
                        ) : (
                          <span>Keep it up — consistent contributions make this predictable.</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Chart */}
                <div className="mt-6" style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results.monthlySeries}>
                      <CartesianGrid stroke={dark ? '#1f2937' : '#f1f5f9'} />
                      <XAxis dataKey="date" tick={{ fill: dark ? '#cbd5e1' : '#475569' }} />
                      <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fill: dark ? '#cbd5e1' : '#475569' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Series table (compact) */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
                    <div className="text-xs text-slate-400">Completion Date</div>
                    <div className="font-medium">{formatDate(results.completionDate)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
                    <div className="text-xs text-slate-400">Months</div>
                    <div className="font-medium">{results.months}</div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
                    <div className="text-xs text-slate-400">{mode === 'debt' ? 'Total Paid' : 'Total Savings'}</div>
                    <div className="font-medium">{money(results.totalContributions + results.totalGrowth)}</div>
                  </div>
                </div>

                {/* share preview (hidden) */}
                <div className="hidden" ref={shareRef} aria-hidden>
                  {/* This is used as the reference for canvas generation */}
                  <div style={{ padding: 20, width: 1200, height: 630, background: dark ? '#0f172a' : '#ffffff' }}>
                    <h2 style={{ color: dark ? '#e6eef8' : '#0b1b2b' }}>{goalName}</h2>
                    <div style={{ color: dark ? '#9aa7b3' : '#475569' }}>{formatDate(results.completionDate)} — {results.months} months</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-slate-400">
          <div>Built with ❤️ — share with friends if it helps.</div>
        </footer>
      </div>
    </main>
  );
}
