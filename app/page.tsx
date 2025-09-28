'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calculator, TrendingUp, Share2, Target, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Type definitions
interface Results {
  months: number;
  completionDate: Date;
  totalContributions: number;
  totalGrowth: number;
  message: string;
}

interface ChartData {
  month: number;
  balance: number;
  goal?: number;
}

export default function Page() {
  const [goalName, setGoalName] = useState<string>('');
  const [goalAmount, setGoalAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [monthlyContribution, setMonthlyContribution] = useState<string>('');
  const [annualGrowthRate, setAnnualGrowthRate] = useState<string>('0');
  const [results, setResults] = useState<Results | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const calculateMonthsToGoal = (goal: number, current: number, monthly: number, annualRate: number): number => {
    const monthlyRate = annualRate / 100 / 12;
    let balance = current;
    let months = 0;

    while (balance < goal && months < 1200) {
      months++;
      const interest = balance * monthlyRate;
      balance = balance + monthly + interest;
    }
    return months;
  };

  const calculateGoal = () => {
    const goal = parseFloat(goalAmount) || 0;
    const current = parseFloat(currentAmount) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const annualRate = parseFloat(annualGrowthRate) || 0;
    const monthlyRate = annualRate / 100 / 12;

    if (goal <= current) {
      setResults({
        months: 0,
        completionDate: new Date(),
        totalContributions: 0,
        totalGrowth: 0,
        message: "🎉 Congratulations! You've already reached your goal!"
      });
      return;
    }

    let balance = current;
    let months = 0;
    let totalContributions = 0;
    const data: ChartData[] = [{month: 0, balance: current}];

    while (balance < goal && months < 1200) {
      months++;
      const interest = balance * monthlyRate;
      balance = balance + monthly + interest;
      totalContributions += monthly;
      
      if (months <= 240 || months % 3 === 0) {
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
    if (months <= 12) {
      message = `🚀 Amazing! You'll reach your goal in under a year!`;
    } else if (months <= 36) {
      message = `💪 Great plan! You're on track for success in ${Math.round(months)} months!`;
    } else {
      const extraMonthly = monthly * 1.25;
      const fasterMonths = calculateMonthsToGoal(goal, current, extraMonthly, annualRate);
      const monthsSaved = months - fasterMonths;
      if (monthsSaved > 0) {
        message = `💡 Tip: Adding just $${Math.round(extraMonthly - monthly)} more per month could save you ${monthsSaved} months!`;
      } else {
        message = `🎯 Stay consistent and you'll reach your goal in ${Math.round(months / 12)} years!`;
      }
    }

    setResults({
      months,
      completionDate,
      totalContributions,
      totalGrowth: Math.round(balance - current - totalContributions),
      message
    });
    
    setChartData(data);
  };

  useEffect(() => {
    if (goalAmount && currentAmount && monthlyContribution) {
      calculateGoal();
    }
  }, [goalAmount, currentAmount, monthlyContribution, annualGrowthRate]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  const handleShare = () => {
    const canvas = canvasRef.current;
    if (!canvas || !results) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = 1200;
    const height = 630;
    
    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#334155');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < width; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    // Title
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
    ctx.fillText('🎯 GoalTrackr', 60, 80);

    // Goal name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.fillText(goalName || 'My Financial Goal', 60, 160);

    // Goal amount
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
    ctx.fillText(formatCurrency(parseFloat(goalAmount) || 0), 60, 240);

    // Progress bar
    const barX = 60;
    const barY = 280;
    const barWidth = width - 120;
    const barHeight = 40;
    const progressPercentage = Math.min(100, ((parseFloat(currentAmount) || 0) / (parseFloat(goalAmount) || 1)) * 100);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth * (progressPercentage / 100), barY);
    progressGradient.addColorStop(0, '#3b82f6');
    progressGradient.addColorStop(1, '#10b981');
    ctx.fillStyle = progressGradient;
    ctx.fillRect(barX, barY, barWidth * (progressPercentage / 100), barHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${progressPercentage.toFixed(0)}% Complete`, barX + barWidth / 2 - 80, barY + barHeight + 40);

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `goaltrackr-${goalName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <Target className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              GoalTrackr
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Track your financial goals with confidence</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <Calculator className="w-6 h-6" />
                Goal Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g., Save for a house down payment"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Amount ($)
                </label>
                <input
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Amount Saved ($)
                </label>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Contribution ($)
                </label>
                <div className="relative">
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Growth Rate (%)
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setAnnualGrowthRate('0')}
                    className={`px-3 py-1 rounded-lg text-sm ${annualGrowthRate === '0' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Cash (0%)
                  </button>
                  <button
                    onClick={() => setAnnualGrowthRate('4')}
                    className={`px-3 py-1 rounded-lg text-sm ${annualGrowthRate === '4' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    HYSA (4%)
                  </button>
                  <button
                    onClick={() => setAnnualGrowthRate('7')}
                    className={`px-3 py-1 rounded-lg text-sm ${annualGrowthRate === '7' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  >
                    Stocks (7%)
                  </button>
                </div>
                <input
                  type="number"
                  value={annualGrowthRate}
                  onChange={(e) => setAnnualGrowthRate(e.target.value)}
                  placeholder="0"
                  step="0.1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                />
              </div>

              <button
                onClick={calculateGoal}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
              >
                Calculate My Goal 🎯
              </button>
            </div>

            <div className="space-y-6">
              {results && (
                <>
                  <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    Your Goal Projection
                  </h2>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Completion Date</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatDate(results.completionDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Time to Goal</span>
                      <span className="text-xl font-bold text-purple-600">
                        {results.months} months
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Contributions</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(results.totalContributions)}
                      </span>
                    </div>

                    {results.totalGrowth > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Investment Growth</span>
                        <span className="text-xl font-bold text-emerald-600">
                          +{formatCurrency(results.totalGrowth)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                      <p className="text-gray-800 font-medium">{results.message}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleShare}
                    className="w-full py-3 bg-gray-800 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    Share My Result
                  </button>
                </>
              )}
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="mt-10 pt-10 border-t border-gray-200">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Progress Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
                    stroke="#888"
                  />
                  <YAxis 
                    label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                    stroke="#888"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    labelFormatter={(month) => `Month ${month}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={false}
                    name="Your Progress"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="goal" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Goal Target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}