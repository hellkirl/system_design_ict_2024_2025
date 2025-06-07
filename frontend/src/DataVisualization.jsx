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

    const hasMLResults = results.machine_learning && Object.keys(results.machine_learning).length > 0;
    const stats = results.statistics || results;

    const numericColumns = Object.keys(stats).filter(key =>
        key !== 'id' && key !== 'category' && typeof stats[key] === 'object' && stats[key].mean
    );

    const distributionData = {
        labels: numericColumns,
        datasets: [
            {
                label: 'Min',
                data: numericColumns.map(col => parseFloat(stats[col]?.min || 0)),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
            {
                label: 'Q1 (25%)',
                data: numericColumns.map(col => parseFloat(stats[col]?.['25%'] || 0)),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
            {
                label: 'Median (50%)',
                data: numericColumns.map(col => parseFloat(stats[col]?.['50%'] || 0)),
                backgroundColor: 'rgba(255, 206, 86, 0.6)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1,
            },
            {
                label: 'Q3 (75%)',
                data: numericColumns.map(col => parseFloat(stats[col]?.['75%'] || 0)),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
            {
                label: 'Max',
                data: numericColumns.map(col => parseFloat(stats[col]?.max || 0)),
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
                data: numericColumns.map(col => parseFloat(stats[col]?.mean || 0)),
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
                    const mean = parseFloat(stats[col]?.mean || 1);
                    const std = parseFloat(stats[col]?.stddev || 0);
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
                    const max = parseFloat(stats[col]?.max || 0);
                    const min = parseFloat(stats[col]?.min || 0);
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

            {/* ML Results Section */}
            {hasMLResults && (
                <div className="ml-results-section">
                    <h3>Machine Learning Results</h3>

                    {/* Data Summary */}
                    {results.machine_learning.data_summary && (
                        <div className="ml-summary">
                            <div className="ml-summary-card">
                                <h4>Dataset Overview</h4>
                                <p><strong>Total Rows:</strong> {results.machine_learning.data_summary.total_rows?.toLocaleString()}</p>
                                <p><strong>Numeric Columns:</strong> {results.machine_learning.data_summary.numeric_columns}</p>
                                <p><strong>Categorical Columns:</strong> {results.machine_learning.data_summary.categorical_columns}</p>
                            </div>
                        </div>
                    )}

                    {/* Classification Results */}
                    {results.machine_learning.classification && (
                        <div className="ml-model-card">
                            <h4>Classification Model</h4>
                            {results.machine_learning.classification.error ? (
                                <p className="error">Error: {results.machine_learning.classification.error}</p>
                            ) : (
                                <div className="model-details">
                                    <div className="model-metrics">
                                        <div className="metric">
                                            <span className="metric-label">Model:</span>
                                            <span className="metric-value">{results.machine_learning.classification.model_type}</span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Target:</span>
                                            <span className="metric-value">{results.machine_learning.classification.target_column}</span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Accuracy:</span>
                                            <span className="metric-value accuracy-low">
                                                {(results.machine_learning.classification.accuracy * 100).toFixed(2)}%
                                                {results.machine_learning.classification.accuracy < 0.6 &&
                                                    <span className="accuracy-note"> (Low - features may not be predictive)</span>
                                                }
                                            </span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Training Size:</span>
                                            <span className="metric-value">{results.machine_learning.classification.train_size?.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Feature Importance */}
                                    {results.machine_learning.classification.feature_importance && (
                                        <div className="feature-importance">
                                            <h5>Feature Importance</h5>
                                            <div className="importance-bars">
                                                {Object.entries(results.machine_learning.classification.feature_importance)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .map(([feature, importance]) => (
                                                        <div key={feature} className="importance-bar">
                                                            <span className="feature-name">{feature}</span>
                                                            <div className="bar-container">
                                                                <div
                                                                    className="bar-fill importance"
                                                                    style={{ width: `${(importance * 100).toFixed(1)}%` }}
                                                                ></div>
                                                                <span className="importance-value">{(importance * 100).toFixed(1)}%</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Regression Results */}
                    {results.machine_learning.regression && (
                        <div className="ml-model-card">
                            <h4>Regression Model</h4>
                            {results.machine_learning.regression.error ? (
                                <p className="error">Error: {results.machine_learning.regression.error}</p>
                            ) : (
                                <div className="model-details">
                                    <div className="model-metrics">
                                        <div className="metric">
                                            <span className="metric-label">Model:</span>
                                            <span className="metric-value">{results.machine_learning.regression.model_type}</span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">Target:</span>
                                            <span className="metric-value">{results.machine_learning.regression.target_column}</span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">R² Score:</span>
                                            <span className={`metric-value ${results.machine_learning.regression.r2_score < 0 ? 'r2-negative' : ''}`}>
                                                {results.machine_learning.regression.r2_score?.toFixed(4)}
                                                {results.machine_learning.regression.r2_score < 0 &&
                                                    <span className="r2-note"> (Negative - model performs worse than baseline)</span>
                                                }
                                            </span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-label">RMSE:</span>
                                            <span className="metric-value">{results.machine_learning.regression.rmse?.toFixed(4)}</span>
                                        </div>
                                    </div>

                                    {/* Feature Importance */}
                                    {results.machine_learning.regression.feature_importance && (
                                        <div className="feature-importance">
                                            <h5>Feature Importance</h5>
                                            <div className="importance-bars">
                                                {Object.entries(results.machine_learning.regression.feature_importance)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .map(([feature, importance]) => (
                                                        <div key={feature} className="importance-bar">
                                                            <span className="feature-name">{feature}</span>
                                                            <div className="bar-container">
                                                                <div
                                                                    className="bar-fill importance"
                                                                    style={{ width: `${(importance * 100).toFixed(1)}%` }}
                                                                ></div>
                                                                <span className="importance-value">{(importance * 100).toFixed(1)}%</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Correlation Matrix */}
                    {results.machine_learning.correlations && (
                        <div className="ml-model-card">
                            <h4>Correlation Analysis</h4>
                            {results.machine_learning.correlations.error ? (
                                <p className="error">Error: {results.machine_learning.correlations.error}</p>
                            ) : (
                                <div className="correlation-matrix">
                                    <p className="correlation-note">
                                        <strong>Insight:</strong> Very low correlations (close to 0) indicate variables are independent -
                                        explains why ML models have low predictive power.
                                    </p>
                                    <table className="correlation-table">
                                        <thead>
                                            <tr>
                                                <th></th>
                                                {results.machine_learning.correlations.columns?.map(col => (
                                                    <th key={col}>{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.machine_learning.correlations.columns?.map(row => (
                                                <tr key={row}>
                                                    <th>{row}</th>
                                                    {results.machine_learning.correlations.columns.map(col => {
                                                        const corr = results.machine_learning.correlations.correlation_matrix[row]?.[col];
                                                        return (
                                                            <td
                                                                key={col}
                                                                className="correlation-cell"
                                                                style={{
                                                                    backgroundColor: `rgba(${corr > 0 ? '0,123,255' : '255,0,0'}, ${Math.abs(corr) * 0.8})`
                                                                }}
                                                            >
                                                                {corr?.toFixed(3)}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Category Distribution */}
                    {stats.category && (
                        <div className="ml-model-card">
                            <h4>Category Distribution</h4>
                            <div className="category-stats">
                                <p><strong>Unique Categories:</strong> {stats.category.unique_values}</p>
                                <div className="category-bars">
                                    {Object.entries(stats.category.value_counts).map(([category, count]) => {
                                        const percentage = (count / 5000 * 100).toFixed(1);
                                        return (
                                            <div key={category} className="category-bar">
                                                <span className="category-name">Category {category}</span>
                                                <div className="bar-container">
                                                    <div
                                                        className="bar-fill category"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                    <span className="category-value">{count} ({percentage}%)</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Summary Cards */}
            <div className="summary-cards">
                {numericColumns.map(col => (
                    <div key={col} className="summary-card">
                        <h4>{col.toUpperCase()}</h4>
                        <div className="card-stats">
                            <div className="stat-item">
                                <span className="stat-label">Mean:</span>
                                <span className="stat-value">{parseFloat(stats[col]?.mean || 0).toFixed(3)}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Std Dev:</span>
                                <span className="stat-value">{parseFloat(stats[col]?.stddev || 0).toFixed(3)}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Range:</span>
                                <span className="stat-value">
                                    {parseFloat(stats[col]?.min || 0).toFixed(2)} - {parseFloat(stats[col]?.max || 0).toFixed(2)}
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
                    <p className="chart-subtitle">Higher values indicate more relative variability</p>
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
                            const mean = parseFloat(stats[col]?.mean || 0);
                            const std = parseFloat(stats[col]?.stddev || 0);
                            const cv = ((std / mean) * 100);
                            const min = parseFloat(stats[col]?.min || 0);
                            const max = parseFloat(stats[col]?.max || 0);
                            const range = max - min;

                            return (
                                <tr key={col}>
                                    <td><strong>{col}</strong></td>
                                    <td>{stats[col]?.count || 'N/A'}</td>
                                    <td>{mean.toFixed(3)}</td>
                                    <td>{std.toFixed(3)}</td>
                                    <td>{cv.toFixed(1)}%</td>
                                    <td>{min.toFixed(3)}</td>
                                    <td>{parseFloat(stats[col]?.['25%'] || 0).toFixed(3)}</td>
                                    <td>{parseFloat(stats[col]?.['50%'] || 0).toFixed(3)}</td>
                                    <td>{parseFloat(stats[col]?.['75%'] || 0).toFixed(3)}</td>
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