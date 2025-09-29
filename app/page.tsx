{/* Chart */}
              {chartData.length > 0 && (
                <div className={`mt-8 pt-8 border-t-2 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-6`}>Projected Growth</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#475569' : '#e2e8f0'} />
                      <XAxis 
                        dataKey="month" 
                        label={{ value: 'Months', position: 'insideBottom', offset: -5, fill: darkMode ? '#94a3b8' : '#64748b' }}
                        stroke={darkMode ? '#94a3b8' : '#64748b'}
                      />
                      <YAxis 
                        stroke={darkMode ? '#94a3b8' : '#64748b'}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(month) => `Month ${month}`}
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#1e293b' : '#f8fafc', 
                          border: `1px solid ${darkMode ? '#475569' : '#e2e8f0'}`,
                          borderRadius: '8px'
                        }}
                        itemStyle={{ color: darkMode ? '#e2e8f0' : '#1e293b' }}
                        labelStyle={{ color: darkMode ? '#e2e8f0' : '#1e293b' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3b82f6" 
                        fillOpacity={1}
                        fill="url(#colorBalance)"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="goal" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debt Calculator */}
        {calculatorMode === 'debt' && (
          <div className={`${darkMode ? 'bg-slate-800/50 backdrop-blur-sm' : 'bg-white'} rounded-2xl shadow-xl overflow-hidden transition-colors duration-300`}>
            <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6">
              <h2 className="text-2xl font-bold text-white text-center flex items-center justify-center gap-3">
                <CreditCard className="w-7 h-7" />
                Debt Payoff Calculator
              </h2>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-6">
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                    <Calculator className="w-6 h-6 text-red-500" />
                    Debt Details
                  </h2>

                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                      Debt Name
                    </label>
                    <input
                      type="text"
                      value={debtName}
                      onChange={(e) => setDebtName(e.target.value)}
                      placeholder="e.g., Credit Card, Student Loan"
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-red-400' 
                          : 'bg-white border-slate-200 text-slate-900 focus:border-red-500'
                      } focus:ring-4 focus:ring-red-100/30 transition-all outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                      Current Balance ($)
                    </label>
                    <input
                      type="number"
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                      placeholder="10000"
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-red-400' 
                          : 'bg-white border-slate-200 text-slate-900 focus:border-red-500'
                      } focus:ring-4 focus:ring-red-100/30 transition-all outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                      Interest Rate (% APR)
                    </label>
                    <input'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Share2, 
  Target, 
  Sparkles,
  Calendar,
  DollarSign,
  PiggyBank,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  Trophy,
  Zap,
  ArrowRight,
  CheckCircle,
  Moon,
  Sun
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Type definitions
interface SavingsResults {
  months: number;
  completionDate: Date;
  totalContributions: number;
  totalGrowth: number;
  message: string;
  milestones: Milestone[];
}

interface ReverseResults {
  requiredMonthly: number;
  totalContributions: number;
  totalGrowth: number;
  message: string;
}

interface DebtResults {
  months: number;
  payoffDate: Date;
  totalPaid: number;
  totalInterest: number;
  savingsWithExtra: number;
  monthsSaved: number;
  message: string;
}

interface ChartData {
  month: number;
  balance: number;
  goal?: number;
  principal?: number;
}

interface Milestone {
  percentage: number;
  amount: number;
  label: string;
  reached: boolean;
}

type CalculatorMode = 'savings' | 'debt';
type SavingsMode = 'timeToGoal' | 'monthlyNeeded';

export default function Page() {
  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Main mode toggle
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('savings');
  
  // Savings calculator states
  const [savingsMode, setSavingsMode] = useState<SavingsMode>('timeToGoal');
  const [goalName, setGoalName] = useState<string>('');
  const [goalAmount, setGoalAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [monthlyContribution, setMonthlyContribution] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [annualGrowthRate, setAnnualGrowthRate] = useState<string>('7');
  const [savingsResults, setSavingsResults] = useState<SavingsResults | null>(null);
  const [reverseResults, setReverseResults] = useState<ReverseResults | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  
  // Debt calculator states
  const [debtName, setDebtName] = useState<string>('');
  const [debtAmount, setDebtAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [minimumPayment, setMinimumPayment] = useState<string>('');
  const [extraPayment, setExtraPayment] = useState<string>('0');
  const [debtResults, setDebtResults] = useState<DebtResults | null>(null);
  const [debtChartData, setDebtChartData] = useState<ChartData[]>([]);
  
  // Share card ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate milestones
  const calculateMilestones = (current: number, goal: number): Milestone[] => {
    const percentComplete = (current / goal) * 100;
    const milestones: Milestone[] = [
      { percentage: 25, amount: goal * 0.25, label: 'Quarter Way', reached: percentComplete >= 25 },
      { percentage: 50, amount: goal * 0.50, label: 'Halfway There', reached: percentComplete >= 50 },
      { percentage: 75, amount: goal * 0.75, label: 'Final Stretch', reached: percentComplete >= 75 },
      { percentage: 100, amount: goal, label: 'Goal Achieved', reached: percentComplete >= 100 }
    ];
    return milestones;
  };

  // Calculate time to goal
  const calculateTimeToGoal = () => {
    const goal = parseFloat(goalAmount) || 0;
    const current = parseFloat(currentAmount) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const annualRate = parseFloat(annualGrowthRate) || 0;
    const monthlyRate = annualRate / 100 / 12;

    if (goal <= current) {
      setSavingsResults({
        months: 0,
        completionDate: new Date(),
        totalContributions: 0,
        totalGrowth: 0,
        message: "🎉 Congratulations! You've already reached your goal!",
        milestones: calculateMilestones(current, goal)
      });
      return;
    }

    let balance = current;
    let months = 0;
    let totalContributions = 0;
    const data: ChartData[] = [{month: 0, balance: current, goal: goal}];

    while (balance < goal && months < 1200) {
      months++;
      const interest = balance * monthlyRate;
      balance = balance + monthly + interest;
      totalContributions += monthly;
      
      if (months <= 60 || months % 6 === 0) {
        data.push({
          month: months,
          balance: Math.round(balance),
          goal: goal
        });
      }
    }

    const completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + months);

    let message = '';
    const progressPercent = ((current / goal) * 100).toFixed(1);
    
    if (months <= 12) {
      message = `🚀 Amazing! You're ${progressPercent}% there and will reach your goal in under a year!`;
    } else if (months <= 36) {
      message = `💪 Great plan! You're ${progressPercent}% complete. Keep it up for ${Math.round(months)} months!`;
    } else {
      message = `🎯 You're ${progressPercent}% of the way there! Stay consistent for ${Math.round(months / 12)} years!`;
    }

    setSavingsResults({
      months,
      completionDate,
      totalContributions,
      totalGrowth: Math.round(balance - current - totalContributions),
      message,
      milestones: calculateMilestones(current, goal)
    });
    
    setChartData(data);
  };

  // Calculate required monthly savings
  const calculateMonthlyNeeded = () => {
    const goal = parseFloat(goalAmount) || 0;
    const current = parseFloat(currentAmount) || 0;
    const annualRate = parseFloat(annualGrowthRate) || 0;
    const monthlyRate = annualRate / 100 / 12;
    
    if (!targetDate) return;
    
    const target = new Date(targetDate);
    const today = new Date();
    const monthsAvailable = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (monthsAvailable <= 0) {
      setReverseResults({
        requiredMonthly: 0,
        totalContributions: 0,
        totalGrowth: 0,
        message: "⚠️ Please select a future date for your goal!"
      });
      return;
    }

    // Calculate required monthly payment using formula
    let requiredMonthly: number;
    if (monthlyRate === 0) {
      requiredMonthly = (goal - current) / monthsAvailable;
    } else {
      const futureValueNeeded = goal - current * Math.pow(1 + monthlyRate, monthsAvailable);
      requiredMonthly = futureValueNeeded / ((Math.pow(1 + monthlyRate, monthsAvailable) - 1) / monthlyRate);
    }

    requiredMonthly = Math.max(0, requiredMonthly);
    const totalContributions = requiredMonthly * monthsAvailable;
    const totalGrowth = goal - current - totalContributions;

    // Generate chart data
    let balance = current;
    const data: ChartData[] = [{month: 0, balance: current, goal: goal}];
    
    for (let month = 1; month <= monthsAvailable; month++) {
      const interest = balance * monthlyRate;
      balance = balance + requiredMonthly + interest;
      
      if (month <= 60 || month % Math.ceil(monthsAvailable / 20) === 0) {
        data.push({
          month: month,
          balance: Math.round(balance),
          goal: goal
        });
      }
    }
    
    setChartData(data);

    let message = '';
    if (requiredMonthly <= 500) {
      message = `✨ Very achievable! Just ${formatCurrency(requiredMonthly)} per month gets you there!`;
    } else if (requiredMonthly <= 1500) {
      message = `💪 You can do this! Set aside ${formatCurrency(requiredMonthly)} monthly to reach your goal!`;
    } else {
      message = `🎯 Ambitious goal! Consider extending your timeline to reduce the monthly amount.`;
    }

    setReverseResults({
      requiredMonthly,
      totalContributions,
      totalGrowth,
      message
    });
  };

  // Calculate debt payoff
  const calculateDebtPayoff = () => {
    const principal = parseFloat(debtAmount) || 0;
    const apr = parseFloat(interestRate) || 0;
    const monthlyRate = apr / 100 / 12;
    const payment = parseFloat(minimumPayment) || 0;
    const extra = parseFloat(extraPayment) || 0;
    const totalPayment = payment + extra;

    if (totalPayment <= principal * monthlyRate) {
      setDebtResults({
        months: 0,
        payoffDate: new Date(),
        totalPaid: 0,
        totalInterest: 0,
        savingsWithExtra: 0,
        monthsSaved: 0,
        message: "⚠️ Your payment needs to be higher than the monthly interest to pay off the debt!"
      });
      return;
    }

    // Calculate with regular payment
    let balance = principal;
    let months = 0;
    let totalPaid = 0;
    let totalInterest = 0;
    const data: ChartData[] = [{month: 0, balance: principal, principal: principal}];

    while (balance > 0.01 && months < 600) {
      months++;
      const interestCharge = balance * monthlyRate;
      const principalPayment = Math.min(totalPayment - interestCharge, balance);
      balance -= principalPayment;
      totalPaid += totalPayment;
      totalInterest += interestCharge;

      if (months <= 60 || months % Math.ceil(months / 20) === 0) {
        data.push({
          month: months,
          balance: Math.max(0, Math.round(balance)),
          principal: Math.round(principal - totalInterest)
        });
      }
    }

    // Calculate without extra payment for comparison
    let monthsWithoutExtra = 0;
    let balanceWithoutExtra = principal;
    
    if (extra > 0) {
      while (balanceWithoutExtra > 0.01 && monthsWithoutExtra < 600) {
        monthsWithoutExtra++;
        const interestCharge = balanceWithoutExtra * monthlyRate;
        const principalPayment = Math.min(payment - interestCharge, balanceWithoutExtra);
        balanceWithoutExtra -= principalPayment;
      }
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);

    const monthsSaved = extra > 0 ? monthsWithoutExtra - months : 0;
    const savingsWithExtra = extra > 0 ? (monthsWithoutExtra - months) * payment : 0;

    let message = '';
    if (extra > 0 && monthsSaved > 0) {
      message = `🎯 Great strategy! Your extra ${formatCurrency(extra)}/month saves you ${monthsSaved} months and ${formatCurrency(savingsWithExtra)} in payments!`;
    } else if (months <= 24) {
      message = `🚀 Excellent! You'll be debt-free in just ${months} months!`;
    } else {
      message = `💪 Stay consistent! You'll eliminate this debt in ${Math.round(months / 12)} years.`;
    }

    setDebtResults({
      months,
      payoffDate,
      totalPaid,
      totalInterest,
      savingsWithExtra,
      monthsSaved,
      message
    });

    setDebtChartData(data);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  // Generate share card
  const generateShareCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = 1200;
    const height = 630;
    
    canvas.width = width;
    canvas.height = height;

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative elements
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(width - 150, height - 150, 50 + i * 30, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Title
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
    ctx.fillText('💰 GoalTrackr Pro', 60, 90);

    // Goal info
    if (calculatorMode === 'savings' && savingsResults) {
      const goal = parseFloat(goalAmount) || 0;
      const current = parseFloat(currentAmount) || 0;
      const progress = (current / goal) * 100;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
      ctx.fillText(goalName || 'Financial Goal', 60, 180);

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
      ctx.fillText(formatCurrency(goal), 60, 270);

      // Progress bar
      const barX = 60;
      const barY = 320;
      const barWidth = width - 120;
      const barHeight = 50;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth * (progress / 100), barY);
      progressGradient.addColorStop(0, '#3b82f6');
      progressGradient.addColorStop(1, '#10b981');
      ctx.fillStyle = progressGradient;
      ctx.fillRect(barX, barY, barWidth * (progress / 100), barHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${progress.toFixed(1)}% Complete`, barX + barWidth / 2 - 100, barY + barHeight + 45);

      // Stats
      ctx.fillStyle = '#94a3b8';
      ctx.font = '24px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Target Date: ${formatDate(savingsResults.completionDate)}`, 60, 480);
      ctx.fillText(`Monthly Savings: ${formatCurrency(parseFloat(monthlyContribution) || 0)}`, 60, 520);

      // Motivational message
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'italic 28px system-ui, -apple-system, sans-serif';
      ctx.fillText(savingsResults.message.substring(0, 50) + '...', 60, 580);
    }

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `goaltrackr-${(goalName || debtName || 'goal').replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  // Initialize dark mode from system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  // Auto-calculate effects
  useEffect(() => {
    if (savingsMode === 'timeToGoal' && goalAmount && currentAmount && monthlyContribution) {
      calculateTimeToGoal();
    }
  }, [goalAmount, currentAmount, monthlyContribution, annualGrowthRate, savingsMode]);

  useEffect(() => {
    if (savingsMode === 'monthlyNeeded' && goalAmount && currentAmount && targetDate) {
      calculateMonthlyNeeded();
    }
  }, [goalAmount, currentAmount, targetDate, annualGrowthRate, savingsMode]);

  useEffect(() => {
    if (debtAmount && interestRate && minimumPayment) {
      calculateDebtPayoff();
    }
  }, [debtAmount, interestRate, minimumPayment, extraPayment]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">GoalTrackr Pro</h1>
                <p className="text-sm text-slate-600">Financial Planning Made Simple</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mode Selector */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <button
            onClick={() => setCalculatorMode('savings')}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              calculatorMode === 'savings'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-400'
            }`}
          >
            <PiggyBank className="w-5 h-5" />
            Savings Goal
          </button>
          <button
            onClick={() => setCalculatorMode('debt')}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              calculatorMode === 'debt'
                ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-red-400'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Debt Payoff
          </button>
        </div>

        {/* Savings Calculator */}
        {calculatorMode === 'savings' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Savings Mode Toggle */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setSavingsMode('timeToGoal')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    savingsMode === 'timeToGoal'
                      ? 'bg-white text-blue-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  When will I reach my goal?
                </button>
                <div className="text-white">
                  {savingsMode === 'timeToGoal' ? <ToggleLeft className="w-6 h-6" /> : <ToggleRight className="w-6 h-6" />}
                </div>
                <button
                  onClick={() => setSavingsMode('monthlyNeeded')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    savingsMode === 'monthlyNeeded'
                      ? 'bg-white text-blue-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  How much should I save monthly?
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-blue-500" />
                    Goal Details
                  </h2>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      What are you saving for?
                    </label>
                    <input
                      type="text"
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      placeholder="e.g., Dream Home Down Payment"
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Goal Amount ($)
                    </label>
                    <input
                      type="number"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      placeholder="50000"
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Current Savings ($)
                    </label>
                    <input
                      type="number"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      placeholder="5000"
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-slate-900"
                    />
                  </div>

                  {savingsMode === 'timeToGoal' ? (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Monthly Contribution ($)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        step="50"
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(e.target.value)}
                        className="w-full mb-2"
                      />
                      <input
                        type="number"
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(e.target.value)}
                        placeholder="500"
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-slate-900"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-slate-900"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Expected Annual Return (%)
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <button
                        onClick={() => setAnnualGrowthRate('0')}
                        className={`py-2 px-3 rounded-lg font-medium transition-all ${
                          annualGrowthRate === '0' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Cash
                        <span className="block text-xs opacity-75">0%</span>
                      </button>
                      <button
                        onClick={() => setAnnualGrowthRate('4')}
                        className={`py-2 px-3 rounded-lg font-medium transition-all ${
                          annualGrowthRate === '4' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        HYSA
                        <span className="block text-xs opacity-75">4%</span>
                      </button>
                      <button
                        onClick={() => setAnnualGrowthRate('7')}
                        className={`py-2 px-3 rounded-lg font-medium transition-all ${
                          annualGrowthRate === '7' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Stocks
                        <span className="block text-xs opacity-75">7%</span>
                      </button>
                    </div>
                    <input
                      type="number"
                      value={annualGrowthRate}
                      onChange={(e) => setAnnualGrowthRate(e.target.value)}
                      step="0.1"
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-slate-900"
                    />
                  </div>

                  <button
                    onClick={savingsMode === 'timeToGoal' ? calculateTimeToGoal : calculateMonthlyNeeded}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    Calculate My Plan
                  </button>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                  {(savingsMode === 'timeToGoal' ? savingsResults : reverseResults) && (
                    <>
                      <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-green-500" />
                        Your Results
                      </h2>

                      {savingsMode === 'timeToGoal' && savingsResults ? (
                        <>
                          {/* Progress Bar */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-semibold text-slate-700">Progress</span>
                              <span className="text-2xl font-bold text-blue-600">
                                {((parseFloat(currentAmount) / parseFloat(goalAmount)) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, (parseFloat(currentAmount) / parseFloat(goalAmount)) * 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Key Metrics */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span className="text-sm text-slate-600">Target Date</span>
                              </div>
                              <p className="text-xl font-bold text-slate-900">
                                {formatDate(savingsResults.completionDate)}
                              </p>
                              <p className="text-sm text-slate-500">{savingsResults.months} months</p>
                            </div>

                            <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-slate-600">Total Saved</span>
                              </div>
                              <p className="text-xl font-bold text-slate-900">
                                {formatCurrency(savingsResults.totalContributions)}
                              </p>
                              <p className="text-sm text-green-600">
                                +{formatCurrency(savingsResults.totalGrowth)} growth
                              </p>
                            </div>
                          </div>

                          {/* Milestones */}
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                              <Trophy className="w-5 h-5 text-purple-500" />
                              Milestones
                            </h3>
                            <div className="space-y-3">
                              {savingsResults.milestones.map((milestone, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      milestone.reached 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-slate-200 text-slate-500'
                                    }`}>
                                      {milestone.reached ? (
                                        <CheckCircle className="w-5 h-5" />
                                      ) : (
                                        <span className="text-xs font-bold">{milestone.percentage}%</span>
                                      )}
                                    </div>
                                    <span className={`font-medium ${
                                      milestone.reached ? 'text-slate-900' : 'text-slate-500'
                                    }`}>
                                      {milestone.label}
                                    </span>
                                  </div>
                                  <span className={`text-sm font-semibold ${
                                    milestone.reached ? 'text-green-600' : 'text-slate-400'
                                  }`}>
                                    {formatCurrency(milestone.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : reverseResults ? (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                            <div className="text-center">
                              <p className="text-sm text-slate-600 mb-2">Required Monthly Savings</p>
                              <p className="text-5xl font-bold text-green-600">
                                {formatCurrency(reverseResults.requiredMonthly)}
                              </p>
                              <p className="text-sm text-slate-500 mt-2">per month</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                              <span className="text-sm text-slate-600">Total Contributions</span>
                              <p className="text-xl font-bold text-slate-900">
                                {formatCurrency(reverseResults.totalContributions)}
                              </p>
                            </div>
                            <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                              <span className="text-sm text-slate-600">Investment Growth</span>
                              <p className="text-xl font-bold text-green-600">
                                +{formatCurrency(reverseResults.totalGrowth)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Motivational Message */}
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                          <p className="text-slate-800 font-medium">
                            {savingsMode === 'timeToGoal' ? savingsResults?.message : reverseResults?.message}
                          </p>
                        </div>
                      </div>

                      {/* Share Button */}
                      <button
                        onClick={generateShareCard}
                        className="w-full py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-5 h-5" />
                        Share My Goal
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="mt-8 pt-8 border-t-2 border-slate-200">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Projected Growth</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="month" 
                        label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
                        stroke="#64748b"
                      />
                      <YAxis 
                        stroke="#64748b"
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(month) => `Month ${month}`}
                        contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3b82f6" 
                        fillOpacity={1}
                        fill="url(#colorBalance)"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="goal" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debt Calculator */}
        {calculatorMode === 'debt' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6">
              <h2 className="text-2xl font-bold text-white text-center flex items-center justify-center gap-3">
                <CreditCard className="w-7 h-7" />
                Debt Payoff Calculator
              </h2>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-red-500" />
                    Debt Details
                  </h2>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Debt Name
                    </label>
                    <input
                      type="text"
                      value={debtName}
                      onChange={(e) => setDebtName(e.target.value)}
                      placeholder="e.g., Credit Card, Student Loan"
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all outline-none text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Current Balance ($)
                    </label>
                    <input
                      type="number"
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                      placeholder="10000"
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all outline-none text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Interest Rate (% APR)
                    </label>
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="18.99"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all outline-none text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Minimum Monthly Payment ($)
                    </label>
                    <input
                      type="number"
                      value={minimumPayment}
                      onChange={(e) => setMinimumPayment(e.target.value)}
                      placeholder="250"
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all outline-none text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Extra Monthly Payment ($)
                      <span className="text-xs text-slate-500 ml-2">(Optional)</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      step="25"
                      value={extraPayment}
                      onChange={(e) => setExtraPayment(e.target.value)}
                      className="w-full mb-2"
                    />
                    <input
                      type="number"
                      value={extraPayment}
                      onChange={(e) => setExtraPayment(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all outline-none text-slate-900"
                    />
                  </div>

                  <button
                    onClick={calculateDebtPayoff}
                    className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    Calculate Payoff Plan
                  </button>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                  {debtResults && (
                    <>
                      <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-green-500" />
                        Payoff Strategy
                      </h2>

                      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6">
                        <div className="text-center">
                          <p className="text-sm text-slate-600 mb-2">Debt Free In</p>
                          <p className="text-5xl font-bold text-red-600">
                            {debtResults.months}
                          </p>
                          <p className="text-lg text-slate-600">months</p>
                          <p className="text-sm text-slate-500 mt-2">
                            {formatDate(debtResults.payoffDate)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-600">Total Paid</span>
                          </div>
                          <p className="text-xl font-bold text-slate-900">
                            {formatCurrency(debtResults.totalPaid)}
                          </p>
                        </div>

                        <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ArrowRight className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-slate-600">Total Interest</span>
                          </div>
                          <p className="text-xl font-bold text-red-600">
                            {formatCurrency(debtResults.totalInterest)}
                          </p>
                        </div>
                      </div>

                      {parseFloat(extraPayment) > 0 && debtResults.monthsSaved > 0 && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-green-500" />
                            Impact of Extra Payments
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-green-600">{debtResults.monthsSaved}</p>
                              <p className="text-sm text-slate-600">Months Saved</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(debtResults.savingsWithExtra)}
                              </p>
                              <p className="text-sm text-slate-600">Interest Saved</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Motivational Message */}
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                          <p className="text-slate-800 font-medium">{debtResults.message}</p>
                        </div>
                      </div>

                      {/* Share Button */}
                      <button
                        onClick={generateShareCard}
                        className="w-full py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-5 h-5" />
                        Share My Progress
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Debt Chart */}
              {debtChartData.length > 0 && (
                <div className="mt-8 pt-8 border-t-2 border-slate-200">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Payoff Timeline</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={debtChartData}>
                      <defs>
                        <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="month" 
                        label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
                        stroke="#64748b"
                      />
                      <YAxis 
                        stroke="#64748b"
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(month) => `Month ${month}`}
                        contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#ef4444" 
                        fillOpacity={1}
                        fill="url(#colorDebt)"
                        strokeWidth={2}
                        name="Remaining Balance"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden Canvas for Share Card */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}