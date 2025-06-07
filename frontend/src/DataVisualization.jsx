import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

export default function DataVisualization({ results }) {
    if (!results) return null;

    const numericColumns = Object.keys(results).filter(key =>
        key !== 'id' && key !== 'category' && typeof results[key] === 'object'
    );

    const distributionData = {
        labels: numericColumns,
        datasets: [
            {
                label: 'Min',
                data: numericColumns.map(col => parseFloat(results[col]?.min || 0)),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
            {
                label: 'Q1 (25%)',
                data: numericColumns.map(col => parseFloat(results[col]?.['25%'] || 0)),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
            {
                label: 'Median (50%)',
                data: numericColumns.map(col => parseFloat(results[col]?.['50%'] || 0)),
                backgroundColor: 'rgba(255, 206, 86, 0.6)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1,
            },
            {
                label: 'Q3 (75%)',
                data: numericColumns.map(col => parseFloat(results[col]?.['75%'] || 0)),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
            {
                label: 'Max',
                data: numericColumns.map(col => parseFloat(results[col]?.max || 0)),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
            },
        ],
    };

    const meanData = {
        labels: numericColumns,
        datasets: [
            {
                label: 'Mean Values',
                data: numericColumns.map(col => parseFloat(results[col]?.mean || 0)),
                backgroundColor: numericColumns.map((_, index) =>
                    `hsla(${index * 120}, 70%, 60%, 0.6)`
                ),
                borderColor: numericColumns.map((_, index) =>
                    `hsla(${index * 120}, 70%, 50%, 1)`
                ),
                borderWidth: 2,
            },
        ],
    };

    const cvData = {
        labels: numericColumns,
        datasets: [
            {
                label: 'Coefficient of Variation (%)',
                data: numericColumns.map(col => {
                    const mean = parseFloat(results[col]?.mean || 1);
                    const std = parseFloat(results[col]?.stddev || 0);
                    return ((std / mean) * 100).toFixed(2);
                }),
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1,
            },
        ],
    };

    const rangeData = {
        labels: numericColumns,
        datasets: [
            {
                label: 'Data Range (Max - Min)',
                data: numericColumns.map(col => {
                    const max = parseFloat(results[col]?.max || 0);
                    const min = parseFloat(results[col]?.min || 0);
                    return (max - min).toFixed(2);
                }),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    const distributionOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Distribution Analysis (Quartiles)',
            },
        },
        scales: {
            y: {
                beginAtZero: false,
            },
        },
    };

    return (
        <div className="visualization-container">
            <h3>Statistical Analysis Dashboard</h3>

            {/* Summary Cards */}
            <div className="summary-cards">
                {numericColumns.map(col => (
                    <div key={col} className="summary-card">
                        <h4>{col.toUpperCase()}</h4>
                        <div className="card-stats">
                            <div className="stat-item">
                                <span className="stat-label">Mean:</span>
                                <span className="stat-value">{parseFloat(results[col]?.mean || 0).toFixed(3)}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Std Dev:</span>
                                <span className="stat-value">{parseFloat(results[col]?.stddev || 0).toFixed(3)}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Range:</span>
                                <span className="stat-value">
                                    {parseFloat(results[col]?.min || 0).toFixed(2)} - {parseFloat(results[col]?.max || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="charts-grid">
                <div className="chart-item large">
                    <h4>Distribution Analysis (Box Plot Style)</h4>
                    <Bar data={distributionData} options={distributionOptions} />
                </div>

                <div className="chart-item">
                    <h4>Mean Values by Column</h4>
                    <Bar data={meanData} options={chartOptions} />
                </div>

                <div className="chart-item">
                    <h4>Coefficient of Variation (%)</h4>
                    <Bar data={cvData} options={chartOptions} />
                </div>

                <div className="chart-item">
                    <h4>Data Range (Max - Min)</h4>
                    <Bar data={rangeData} options={chartOptions} />
                </div>
            </div>

            {/* Statistics Table */}
            <div className="stats-table">
                <h4>Detailed Statistical Summary</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Variable</th>
                            <th>Count</th>
                            <th>Mean</th>
                            <th>Std Dev</th>
                            <th>CV (%)</th>
                            <th>Min</th>
                            <th>Q1 (25%)</th>
                            <th>Median</th>
                            <th>Q3 (75%)</th>
                            <th>Max</th>
                            <th>Range</th>
                        </tr>
                    </thead>
                    <tbody>
                        {numericColumns.map(col => {
                            const mean = parseFloat(results[col]?.mean || 0);
                            const std = parseFloat(results[col]?.stddev || 0);
                            const cv = ((std / mean) * 100);
                            const min = parseFloat(results[col]?.min || 0);
                            const max = parseFloat(results[col]?.max || 0);
                            const range = max - min;

                            return (
                                <tr key={col}>
                                    <td><strong>{col}</strong></td>
                                    <td>{results[col]?.count || 'N/A'}</td>
                                    <td>{mean.toFixed(3)}</td>
                                    <td>{std.toFixed(3)}</td>
                                    <td>{cv.toFixed(1)}%</td>
                                    <td>{min.toFixed(3)}</td>
                                    <td>{parseFloat(results[col]?.['25%'] || 0).toFixed(3)}</td>
                                    <td>{parseFloat(results[col]?.['50%'] || 0).toFixed(3)}</td>
                                    <td>{parseFloat(results[col]?.['75%'] || 0).toFixed(3)}</td>
                                    <td>{max.toFixed(3)}</td>
                                    <td>{range.toFixed(3)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}