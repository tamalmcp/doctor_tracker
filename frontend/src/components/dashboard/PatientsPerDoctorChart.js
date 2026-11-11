'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function PatientsPerDoctorChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-secondary small py-5">
        No doctor-patient assignments available yet.
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: 'Assigned Patients',
        data: data.map((item) => item.patientCount),
        backgroundColor: 'rgba(15, 118, 110, 0.85)',
        borderColor: 'rgba(15, 118, 110, 1)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterLabel: (ctx) => {
            const doc = data[ctx.dataIndex];
            return doc ? `${doc.specialization} · ${doc.hospital}` : '';
          },
        },
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
      <Bar data={chartData} options={options} />
    </div>
  );
}
