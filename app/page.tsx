'use client';

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
  Trophy,
  Zap,
  ArrowRight,
  CheckCircle,
  Moon,
  Sun,
  Plus,
  Home,
  GraduationCap,
  Palmtree,
  Shield,
  MoreHorizontal,
  Mail,
  Lock,
  User,
  Trash2,
  Edit2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

// Type definitions
interface Goal {
  id: string;
  name: string;
  category: GoalCategory;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  annualGrowthRate: number;
  targetDate?: Date;
  createdAt: Date;
}

type GoalCategory = 'emergency' | 'house' | 'vacation' | 'education' | 'custom';

interface CategoryOption {
  value: GoalCategory;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

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
  futureValue: number;
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

type CalculatorMode = 'savings' | 'debt' | 'multigoal';
type SavingsMode = 'timeToGoal' | 'monthlyNeeded';

const goalCategories: CategoryOption[] = [
  { value: 'emergency', label: 'Emergency Fund', icon: Shield, color: 'text-red-500' },
  { value: 'house', label: 'House Down Payment', icon: Home, color: 'text-blue-500' },
  { value: 'vacation', label: 'Vacation', icon: Palmtree, color: 'text-green-500' },
  { value: 'education', label: 'Education', icon: GraduationCap, color: 'text-purple-500' },
  { value: 'custom', label: 'Custom Goal', icon: MoreHorizontal, color: 'text-gray-500' }
];

export default function Page() {
  // Dark mode state - DEFAULT TO TRUE
  const [darkMode, setDarkMode] = useState<boolean>(true);
  
  // User state (optional login)
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showEmailCapture, setShowEmailCapture] = useState<boolean>(false);
  
  // Main mode toggle
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('savings');
  
  // Multi-goal tracking
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  // Savings calculator states
  const [savingsMode, setSavingsMode] = useState<SavingsMode>('timeToGoal');
  const [goalName, setGoalName] = useState<string>('');
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('custom');
  const [goalAmount, setGoalAmount] = useState<string>('50000');
  const [currentAmount, setCurrentAmount] = useState<string>('5000');
  const [monthlyContribution, setMonthlyContribution] = useState<string>('500');
  const [targetDate, setTargetDate] = useState<string>('');
  const [targetMonths, setTargetMonths] = useState<string>('60');
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

  // Initialize dark mode from system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check localStorage first for user preference
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        setDarkMode(savedDarkMode === 'true');
      } else {
        // Default to true (dark mode)
        setDarkMode(true);
      }
      
      // Load saved goals
      const savedGoals = localStorage.getItem('goals');
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
      
      // Check if user email is saved
      const savedEmail = localStorage.getItem('userEmail');
      if (savedEmail) {
        setUserEmail(savedEmail);
        setIsLoggedIn(true);
      }
    }
  }, []);

  // Save dark mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', String(darkMode));
    }
  }, [darkMode]);

  // Save goals to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && goals.length > 0) {
      localStorage.setItem('goals', JSON.stringify(goals));
    }
  }, [goals]);

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

  // Calculate time to goal with instant updates
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

    if (monthly <= 0) {
      setSavingsResults(null);
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
      const years = Math.round(months / 12);
      const remainingMonths = months % 12;
      message = `🎯 You're ${progressPercent}% of the way there! ${years} years${remainingMonths > 0 ? ` and ${remainingMonths} months` : ''} to go!`;
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
    const months = parseFloat(targetMonths) || 0;
    
    if (months <= 0) {
      setReverseResults(null);
      return;
    }

    // Calculate required monthly payment using formula
    let requiredMonthly: number;
    if (monthlyRate === 0) {
      requiredMonthly = (goal - current) / months;
    } else {
      const futureValueOfCurrent = current * Math.pow(1 + monthlyRate, months);
      const futureValueNeeded = goal - futureValueOfCurrent;
      requiredMonthly = futureValueNeeded / ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    }

    requiredMonthly = Math.max(0, requiredMonthly);
    const totalContributions = requiredMonthly * months;
    const futureValue = current * Math.pow(1 + monthlyRate, months) + requiredMonthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    const totalGrowth = futureValue - current - totalContributions;

    // Generate chart data
    let balance = current;
    const data: ChartData[] = [{month: 0, balance: current, goal: goal}];
    
    for (let month = 1; month <= months; month++) {
      const interest = balance * monthlyRate;
      balance = balance + requiredMonthly + interest;
      
      if (month <= 60 || month % Math.ceil(months / 20) === 0) {
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
      message = `🎯 That's ${formatCurrency(requiredMonthly)}/month. Consider extending your timeline to reduce the monthly amount.`;
    }

    setReverseResults({
      requiredMonthly,
      totalContributions,
      totalGrowth,
      futureValue,
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
    let interestWithoutExtra = 0;
    
    if (extra > 0) {
      while (balanceWithoutExtra > 0.01 && monthsWithoutExtra < 600) {
        monthsWithoutExtra++;
        const interestCharge = balanceWithoutExtra * monthlyRate;
        const principalPayment = Math.min(payment - interestCharge, balanceWithoutExtra);
        balanceWithoutExtra -= principalPayment;
        interestWithoutExtra += interestCharge;
      }
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);

    const monthsSaved = extra > 0 ? monthsWithoutExtra - months : 0;
    const savingsWithExtra = extra > 0 ? interestWithoutExtra - totalInterest : 0;

    let message = '';
    if (extra > 0 && monthsSaved > 0) {
      message = `🎯 Smart move! Your extra ${formatCurrency(extra)}/month saves you ${monthsSaved} months and ${formatCurrency(savingsWithExtra)} in interest!`;
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

  // Save goal
  const saveGoal = () => {
    if (!goalName || !goalAmount || !currentAmount || !monthlyContribution) {
      alert('Please fill in all required fields');
      return;
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      name: goalName,
      category: goalCategory,
      targetAmount: parseFloat(goalAmount),
      currentAmount: parseFloat(currentAmount),
      monthlyContribution: parseFloat(monthlyContribution),
      annualGrowthRate: parseFloat(annualGrowthRate),
      targetDate: targetDate ? new Date(targetDate) : undefined,
      createdAt: new Date()
    };

    setGoals([...goals, newGoal]);
    
    // Show email capture if not logged in
    if (!isLoggedIn && goals.length === 0) {
      setShowEmailCapture(true);
    }
  };

  // Delete goal
  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
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

  // Handle email capture
  const handleEmailCapture = (email: string) => {
    setUserEmail(email);
    setIsLoggedIn(true);
    setShowEmailCapture(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('userEmail', email);
    }
  };

  // Auto-calculate effects with instant updates
  useEffect(() => {
    if (savingsMode === 'timeToGoal' && goalAmount && currentAmount && monthlyContribution) {
      calculateTimeToGoal();
    }
  }, [goalAmount, currentAmount, monthlyContribution, annualGrowthRate, savingsMode]);

  useEffect(() => {
    if (savingsMode === 'monthlyNeeded' && goalAmount && currentAmount && targetMonths) {
      calculateMonthlyNeeded();
    }
  }, [goalAmount, currentAmount, targetMonths, annualGrowthRate, savingsMode]);

  useEffect(() => {
    if (debtAmount && interestRate && minimumPayment) {
      calculateDebtPayoff();
    }
  }, [debtAmount, interestRate, minimumPayment, extraPayment]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
    }`}>
      {/* Header */}
      <div className={`${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border-b shadow-sm backdrop-blur-sm transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  GoalTrackr Pro
                </h1>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Financial Planning Made Simple
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* User Info */}
              {isLoggedIn && (
                <div className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {userEmail}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-xl transition-all ${
                  darkMode 
                    ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
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
                : darkMode
                  ? 'bg-slate-800 text-slate-300 border-2 border-slate-700 hover:border-blue-500'
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
                : darkMode
                  ? 'bg-slate-800 text-slate-300 border-2 border-slate-700 hover:border-red-500'
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-red-400'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Debt Payoff
          </button>
          <button
            onClick={() => setCalculatorMode('multigoal')}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              calculatorMode === 'multigoal'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : darkMode
                  ? 'bg-slate-800 text-slate-300 border-2 border-slate-700 hover:border-purple-500'
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-purple-400'
            }`}
          >
            <Trophy className="w-5 h-5" />
            All Goals ({goals.length})
          </button>
        </div>

        {/* Savings Calculator */}
        {calculatorMode === 'savings' && (
          <div className={`${darkMode ? 'bg-slate-800/50 backdrop-blur-sm' : 'bg-white'} rounded-2xl shadow-xl overflow-hidden transition-colors duration-300`}>
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
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                    <Calculator className="w-6 h-6 text-blue-500" />
                    Goal Details
                  </h2>

                  {/* Category Selection */}
                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                      Goal Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {goalCategories.map(cat => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.value}
                            onClick={() => setGoalCategory(cat.value)}
                            className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-all ${
                              goalCategory === cat.value
                                ? 'bg-blue-500 text-white shadow-lg'
                                : darkMode 
                                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                      What are you saving for?
                    </label>
                    <input
                      type="text"
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      placeholder="e.g., Dream Home Down Payment"
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400' 
                          : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'
                      } focus:ring-4 focus:ring-blue-100/30 transition-all outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                      Goal Amount: {formatCurrency(parseFloat(goalAmount) || 0)}
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="500000"
                      step="1000"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      placeholder="50000"
                      className={`w-full mt-2 px-4 py-3 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400' 
                          : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'
                      } focus:ring-4 focus:ring-blue-100/30 transition-all outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                      Current Savings: {formatCurrency(parseFloat(currentAmount) || 0)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max={goalAmount}
                      step="100"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      value={currentAmount}
                      onChange={(e) => setCurrentAmount(e.target.value)}
                      placeholder="5000"
                      className={`w-full mt-2 px-4 py-3 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400' 
                          : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'
                      } focus:ring-4 focus:ring-blue-100/30 transition-all outline-none`}
                    />
                  </div>

                  {savingsMode === 'timeToGoal' ? (
                    <div>
                      <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                        Monthly Contribution: {formatCurrency(parseFloat(monthlyContribution) || 0)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="50"
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(e.target.value)}
                        className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(e.target.value)}
                        placeholder="500"
                        className={`w-full mt-2 px-4 py-3 rounded-lg border-2 ${
                          darkMode 
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400' 
                            : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'
                        } focus:ring-4 focus:ring-blue-100/30 transition-all outline-none`}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                        Time to Goal: {targetMonths} months ({Math.round(parseFloat(targetMonths) / 12 * 10) / 10} years)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="360"
                        step="1"
                        value={targetMonths}
                        onChange={(e) => setTargetMonths(e.target.value)}
                        className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        value={targetMonths}
                        onChange={(e) => setTargetMonths(e.target.value)}
                        placeholder="60"
                        className={`w-full mt-2 px-4 py-3 rounded-lg border-2 ${
                          darkMode 
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400' 
                            : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'
                        } focus:ring-4 focus:ring-blue-100/30 transition-all outline-none`}
                      />
                    </div>
                  )}

                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                      Expected Annual Return: {annualGrowthRate}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.5"
                      value={annualGrowthRate}
                      onChange={(e) => setAnnualGrowthRate(e.target.value)}
                      className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <button
                        onClick={() => setAnnualGrowthRate('0')}
                        className={`py-2 px-3 rounded-lg font-medium transition-all ${
                          annualGrowthRate === '0' 
                            ? 'bg-blue-500 text-white' 
                            : darkMode 
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Cash
                        <span className="block text-xs opacity-75">0%</span>
                      </button>
                      <button
                        onClick={() => setAnnualGrowthRate('4.5')}
                        className={`py-2 px-3 rounded-lg font-medium transition-all ${
                          annualGrowthRate === '4.5' 
                            ? 'bg-blue-500 text-white' 
                            : darkMode 
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        HYSA
                        <span className="block text-xs opacity-75">4.5%</span>
                      </button>
                      <button
                        onClick={() => setAnnualGrowthRate('8')}
                        className={`py-2 px-3 rounded-lg font-medium transition-all ${
                          annualGrowthRate === '8' 
                            ? 'bg-blue-500 text-white' 
                            : darkMode 
                              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Stocks
                        <span className="block text-xs opacity-75">8%</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={saveGoal}
                      className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Save Goal
                    </button>
                    <button
                      onClick={generateShareCard}
                      className={`py-4 px-6 ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'} rounded-lg transition-all`}
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                  {(savingsMode === 'timeToGoal' ? savingsResults : reverseResults) && (
                    <>
                      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                        <TrendingUp className="w-6 h-6 text-green-500" />
                        Your Results
                      </h2>

                      {savingsMode === 'timeToGoal' && savingsResults ? (
                        <>
                          {/* Progress Bar */}
                          <div className={`${darkMode ? 'bg-slate-700/50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} rounded-xl p-6`}>
                            <div className="flex justify-between items-center mb-3">
                              <span className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Progress</span>
                              <span className="text-2xl font-bold text-blue-500">
                                {((parseFloat(currentAmount) / parseFloat(goalAmount)) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className={`w-full ${darkMode ? 'bg-slate-600' : 'bg-slate-200'} rounded-full h-4 overflow-hidden`}>
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (parseFloat(currentAmount) / parseFloat(goalAmount)) * 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Key Metrics */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-slate-200'} border-2 rounded-xl p-4`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Target Date</span>
                              </div>
                              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {formatDate(savingsResults.completionDate)}
                              </p>
                              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{savingsResults.months} months</p>
                            </div>

                            <div className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-slate-200'} border-2 rounded-xl p-4`}>
                              <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Saved</span>
                              </div>
                              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {formatCurrency(savingsResults.totalContributions)}
                              </p>
                              <p className="text-sm text-green-500">
                                +{formatCurrency(savingsResults.totalGrowth)} growth
                              </p>
                            </div>
                          </div>

                          {/* Milestones */}
                          <div className={`${darkMode ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30' : 'bg-gradient-to-r from-purple-50 to-pink-50'} rounded-xl p-6`}>
                            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-4 flex items-center gap-2`}>
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
                                        : darkMode 
                                          ? 'bg-slate-600 text-slate-300'
                                          : 'bg-slate-200 text-slate-500'
                                    }`}>
                                      {milestone.reached ? (
                                        <CheckCircle className="w-5 h-5" />
                                      ) : (
                                        <span className="text-xs font-bold">{milestone.percentage}%</span>
                                      )}
                                    </div>
                                    <span className={`font-medium ${
                                      milestone.reached 
                                        ? darkMode ? 'text-white' : 'text-slate-900'
                                        : darkMode ? 'text-slate-400' : 'text-slate-500'
                                    }`}>
                                      {milestone.label}
                                    </span>
                                  </div>
                                  <span className={`text-sm font-semibold ${
                                    milestone.reached ? 'text-green-500' : darkMode ? 'text-slate-500' : 'text-slate-400'
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
                          <div className={`${darkMode ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30' : 'bg-gradient-to-r from-green-50 to-emerald-50'} rounded-xl p-6`}>
                            <div className="text-center">
                              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'} mb-2`}>Required Monthly Savings</p>
                              <p className="text-5xl font-bold text-green-500">
                                {formatCurrency(reverseResults.requiredMonthly)}
                              </p>
                              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-2`}>per month for {targetMonths} months</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-slate-200'} border-2 rounded-xl p-4`}>
                              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Contributions</span>
                              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {formatCurrency(reverseResults.totalContributions)}
                              </p>
                            </div>
                            <div className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-slate-200'} border-2 rounded-xl p-4`}>
                              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Investment Growth</span>
                              <p className="text-xl font-bold text-green-500">
                                +{formatCurrency(reverseResults.totalGrowth)}
                              </p>
                            </div>
                          </div>

                          <div className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-slate-200'} border-2 rounded-xl p-4`}>
                            <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'} block mb-2`}>Future Value Breakdown</span>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Current Savings Growth:</span>
                                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {formatCurrency(parseFloat(currentAmount) * Math.pow(1 + parseFloat(annualGrowthRate) / 100 / 12, parseFloat(targetMonths)))}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Monthly Contributions:</span>
                                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {formatCurrency(reverseResults.totalContributions)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Interest Earned:</span>
                                <span className="font-bold text-green-500">
                                  +{formatCurrency(reverseResults.totalGrowth)}
                                </span>
                              </div>
                              <div className="border-t pt-2 flex justify-between">
                                <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Total Future Value:</span>
                                <span className="font-bold text-blue-500 text-xl">
                                  {formatCurrency(reverseResults.futureValue)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Motivational Message */}
                      <div className={`${darkMode ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-600/50' : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'} rounded-xl p-6 border-2`}>
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                          <p className={`${darkMode ? 'text-slate-200' : 'text-slate-800'} font-medium`}>
                            {savingsMode === 'timeToGoal' ? savingsResults?.message : reverseResults?.message}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

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
                      Current Balance: {formatCurrency(parseFloat(debtAmount) || 0)}
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="100000"
                      step="100"
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                      className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      value={debtAmount}
                      onChange={(e) => setDebtAmount(e.target.value)}
                      placeholder="10000"
                      className={`w-full mt-2 px-4 py-3 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-red-400' 
                          : 'bg-white border-slate-200 text-slate-900 focus:border-red-500'
                      } focus:ring-4 focus:ring-red-100/30 transition-all outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                      Interest Rate: {interestRate}% APR
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="18.99"
                      step="0.01"
                      className={`w-full mt-2 px-4 py-3 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-red-400' 
                          : 'bg-white border-slate-200 text-slate-900 focus:border-red-500'
                      } focus:ring-4 focus:ring-red-100/30 transition-all outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                      Minimum Monthly Payment: {formatCurrency(parseFloat(minimumPayment) || 0)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="25"
                      value={minimumPayment}
                      onChange={(e) => setMinimumPayment(e.target.value)}
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      value={minimumPayment}
                      onChange={(e) => setMinimumPayment(e.target.value)}
                      placeholder="250"
                      className={`w-full mt-2 px-4 py-3 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-red-400' 
                          : 'bg-white border-slate-200 text-slate-900 focus:border-red-500'
                      } focus:ring-4 focus:ring-red-100/30 transition-all outline-none`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                      Extra Monthly Payment: {formatCurrency(parseFloat(extraPayment) || 0)}
                      <span className="text-xs text-green-500 ml-2">(Optional - See impact instantly!)</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2000"
                      step="25"
                      value={extraPayment}
                      onChange={(e) => setExtraPayment(e.target.value)}
                      className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      value={extraPayment}
                      onChange={(e) => setExtraPayment(e.target.value)}
                      placeholder="0"
                      className={`w-full mt-2 px-4 py-3 rounded-lg border-2 ${
                        darkMode 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-red-400' 
                          : 'bg-white border-slate-200 text-slate-900 focus:border-red-500'
                      } focus:ring-4 focus:ring-red-100/30 transition-all outline-none`}
                    />
                  </div>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                  {debtResults && (
                    <>
                      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                        <TrendingUp className="w-6 h-6 text-green-500" />
                        Payoff Strategy
                      </h2>

                      <div className={`${darkMode ? 'bg-gradient-to-r from-red-900/30 to-pink-900/30' : 'bg-gradient-to-r from-red-50 to-pink-50'} rounded-xl p-6`}>
                        <div className="text-center">
                          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'} mb-2`}>Debt Free In</p>
                          <p className="text-5xl font-bold text-red-500">
                            {debtResults.months}
                          </p>
                          <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>months</p>
                          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-2`}>
                            {formatDate(debtResults.payoffDate)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-slate-200'} border-2 rounded-xl p-4`}>
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-slate-500" />
                            <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Paid</span>
                          </div>
                          <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {formatCurrency(debtResults.totalPaid)}
                          </p>
                        </div>

                        <div className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-slate-200'} border-2 rounded-xl p-4`}>
                          <div className="flex items-center gap-2 mb-2">
                            <ArrowRight className="w-4 h-4 text-red-500" />
                            <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Interest</span>
                          </div>
                          <p className="text-xl font-bold text-red-500">
                            {formatCurrency(debtResults.totalInterest)}
                          </p>
                        </div>
                      </div>

                      {parseFloat(extraPayment) > 0 && debtResults.monthsSaved > 0 && (
                        <div className={`${darkMode ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-600/50' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'} rounded-xl p-6 border-2`}>
                          <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-3 flex items-center gap-2`}>
                            <Zap className="w-5 h-5 text-green-500" />
                            Impact of Extra Payments
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-green-500">{debtResults.monthsSaved}</p>
                              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Months Saved</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-500">
                                {formatCurrency(debtResults.savingsWithExtra)}
                              </p>
                              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Interest Saved</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Motivational Message */}
                      <div className={`${darkMode ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-600/50' : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'} rounded-xl p-6 border-2`}>
                        <div className="flex items-start gap-3">
                          <Sparkles className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                          <p className={`${darkMode ? 'text-slate-200' : 'text-slate-800'} font-medium`}>{debtResults.message}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Debt Chart */}
              {debtChartData.length > 0 && (
                <div className={`mt-8 pt-8 border-t-2 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-6`}>Payoff Timeline</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={debtChartData}>
                      <defs>
                        <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
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

        {/* Multi-Goal Dashboard */}
        {calculatorMode === 'multigoal' && (
          <div className={`${darkMode ? 'bg-slate-800/50 backdrop-blur-sm' : 'bg-white'} rounded-2xl shadow-xl overflow-hidden transition-colors duration-300`}>
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6">
              <h2 className="text-2xl font-bold text-white text-center flex items-center justify-center gap-3">
                <Trophy className="w-7 h-7" />
                Your Financial Goals Dashboard
              </h2>
            </div>

            <div className="p-8">
              {goals.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                  <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    No goals yet
                  </h3>
                  <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'} mb-6`}>
                    Start by creating your first financial goal
                  </p>
                  <button
                    onClick={() => setCalculatorMode('savings')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Create Your First Goal
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-slate-200'} border-2 rounded-xl p-4 text-center`}>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Goals</p>
                      <p className="text-3xl font-bold text-blue-500">{goals.length}</p>
                    </div>
                    <div className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-slate-200'} border-2 rounded-xl p-4 text-center`}>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total Target</p>
                      <p className="text-3xl font-bold text-green-500">
                        {formatCurrency(goals.reduce((sum, g) => sum + g.targetAmount, 0))}
                      </p>
                    </div>
                    <div className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-slate-200'} border-2 rounded-xl p-4 text-center`}>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Monthly Total</p>
                      <p className="text-3xl font-bold text-purple-500">
                        {formatCurrency(goals.reduce((sum, g) => sum + g.monthlyContribution, 0))}
                      </p>
                    </div>
                  </div>

                  {/* Goals List */}
                  <div className="space-y-4">
                    {goals.map((goal) => {
                      const progress = (goal.currentAmount / goal.targetAmount) * 100;
                      const categoryData = goalCategories.find(c => c.value === goal.category);
                      const Icon = categoryData?.icon || Target;
                      
                      return (
                        <div
                          key={goal.id}
                          className={`${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-slate-200'} border-2 rounded-xl p-6 hover:shadow-lg transition-all`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-600' : 'bg-slate-100'}`}>
                                <Icon className={`w-6 h-6 ${categoryData?.color || 'text-gray-500'}`} />
                              </div>
                              <div>
                                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {goal.name}
                                </h3>
                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {categoryData?.label}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setGoalName(goal.name);
                                  setGoalCategory(goal.category);
                                  setGoalAmount(goal.targetAmount.toString());
                                  setCurrentAmount(goal.currentAmount.toString());
                                  setMonthlyContribution(goal.monthlyContribution.toString());
                                  setAnnualGrowthRate(goal.annualGrowthRate.toString());
                                  setCalculatorMode('savings');
                                }}
                                className={`p-2 rounded-lg ${darkMode ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-200 hover:bg-slate-300'} transition-all`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteGoal(goal.id)}
                                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Progress</span>
                              <span className="text-lg font-bold text-blue-500">{progress.toFixed(1)}%</span>
                            </div>
                            <div className={`w-full ${darkMode ? 'bg-slate-600' : 'bg-slate-200'} rounded-full h-3 overflow-hidden`}>
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, progress)}%` }}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Current: </span>
                                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {formatCurrency(goal.currentAmount)}
                                </span>
                              </div>
                              <div>
                                <span className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Target: </span>
                                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {formatCurrency(goal.targetAmount)}
                                </span>
                              </div>
                              <div>
                                <span className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Monthly: </span>
                                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {formatCurrency(goal.monthlyContribution)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Email Capture Modal */}
      {showEmailCapture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-8 max-w-md w-full`}>
            <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Save Your Progress 🎯
            </h3>
            <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Enter your email to save and track all your financial goals in one place.
            </p>
            <input
              type="email"
              placeholder="your@email.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 mb-4 ${
                darkMode 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-400' 
                  : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'
              } focus:ring-4 focus:ring-blue-100/30 transition-all outline-none`}
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleEmailCapture(userEmail)}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Save Progress
              </button>
              <button
                onClick={() => setShowEmailCapture(false)}
                className={`px-6 py-3 rounded-lg font-semibold ${
                  darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                } transition-all`}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Canvas for Share Card */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}