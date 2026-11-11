'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function DateTrendChart({ data = [], showDoctors = true, showPatients = true }) {
  if (!data || data.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-secondary small py-5">
        No date trend data available for the selected range.
      </div>
    );
  }

  const datasets = [];
  if (showPatients) {
    datasets.push({
      label: 'Patients Registered',
      data: data.map((item) => item.patients),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 3,
    });
  }
  if (showDoctors) {
    datasets.push({
      label: 'Doctors Onboarded',
      data: data.map((item) => item.doctors),
      borderColor: '#0f766e',
      backgroundColor: 'rgba(15, 118, 110, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 3,
    });
  }

  const chartData = {
    labels: data.map((item) => item.date.slice(5)),
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { usePointStyle: true, boxWidth: 8 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
        grid: { color: '#f1f5f9' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height: 290 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
