'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = [
  '#0f766e',
  '#2563eb',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#64748b',
];

export default function ConditionDistributionChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-secondary small py-5">
        No condition breakdown available.
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.condition),
    datasets: [
      {
        data: data.map((item) => item.count),
        backgroundColor: data.map((_, idx) => PALETTE[idx % PALETTE.length]),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 14 },
      },
    },
  };

  return (
    <div style={{ height: 290 }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
