import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { FaUserFriends, FaCar, FaRupeeSign } from 'react-icons/fa';
import { useLoading } from '../context/LoadingContext';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

import '../style/Dashboard.css';
import AddCustomerModal from '../components/AddCustomerModal';
import AddVehicleModal from '../components/AddVehicleModal'; 
import apiService from '../services/apiService';

const CURRENT_YEAR = 2026;
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_MONTH = MONTH_NAMES[new Date().getMonth()];

const rupeeFormatter = (v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`;

const Dashboard = () => {
  const [showCustomer, setShowCustomer] = useState(false);
  const [showVehicle, setShowVehicle] = useState(false);
  const [customers, setCustomers] = useState(null); 
  const [vehicles, setVehicles] = useState(null);
  const [recentCustomersData, setRecentCustomersData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [error, setError] = useState(null);
  const { setIsLoading } = useLoading();
  
  const autoSwitchedYear = useRef(false);
  const yearOptions = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) throw new Error('No authentication token found');

        const [totalCustomersRes, totalVehiclesRes, recentCustomersRes] = await Promise.all([
          apiService.get('/api/customers/get/total'),
          apiService.get('/api/cars/get/total'),
          apiService.get('/api/customers/get/recent'),
        ]);

        setCustomers(totalCustomersRes.data);
        setVehicles(totalVehiclesRes.data);
        setRecentCustomersData(
          Array.isArray(recentCustomersRes.data?.recentCustomers)
            ? recentCustomersRes.data.recentCustomers : []
        );
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  useEffect(() => {
    const fetchMonthly = async () => {
      try {
        const res = await apiService.get(`/api/services/monthly-stats?year=${selectedYear}`);
        const payload = res.data || {};
        const rows = Array.isArray(payload.data) ? payload.data
                   : Array.isArray(payload)      ? payload
                   : [];

        if (!autoSwitchedYear.current) {
          autoSwitchedYear.current = true;
          const hasData = rows.some(r => (r.totalAmount || 0) + (r.newCustomers || 0) > 0);
          if (!hasData) {
            setSelectedYear(prev => prev - 1);
            return;
          }
        }

        // Smart auto-selection: If selected month has no data, pick latest month with data
        if (selectedMonth !== 'All') {
          const currentMonthRow = rows.find(r => r.month === selectedMonth);
          const hasCurrentMonthData = currentMonthRow && ((currentMonthRow.totalAmount || 0) + (currentMonthRow.newCustomers || 0) > 0);
          if (!hasCurrentMonthData) {
            const monthsWithData = rows.filter(r => (r.totalAmount || 0) + (r.newCustomers || 0) > 0);
            if (monthsWithData.length > 0) {
              const latest = monthsWithData[monthsWithData.length - 1];
              setSelectedMonth(latest.month);
            }
          }
        }

        setMonthlyData(rows);
      } catch (err) {
        console.error('Monthly stats error:', err);
      }
    };
    fetchMonthly();
  }, [selectedYear]);

  const chartData = Array.isArray(monthlyData) ? monthlyData : monthlyData?.data || [];

  const summaryStats = selectedMonth === 'All'
    ? chartData.reduce(
        (acc, r) => ({
          totalAmount: acc.totalAmount + (Number(r.totalAmount) || 0),
          collected: acc.collected + (Number(r.collected) || 0),
          pending: acc.pending + (Number(r.pending) || 0),
          newCustomers: acc.newCustomers + (Number(r.newCustomers) || 0)
        }),
        { totalAmount: 0, collected: 0, pending: 0, newCustomers: 0 }
      )
    : (chartData.find(r => r.month === selectedMonth) || {
        totalAmount: 0,
        collected: 0,
        pending: 0,
        newCustomers: 0
      });

  const totalCustomersCount = customers?.totalCustomers ?? 0;
const totalVehiclesCount = vehicles?.totalCars ?? 0;
const totalRevenueValue = customers?.totalRevenue ?? 0;

 const recentCustomers = Array.isArray(recentCustomersData)
  ? recentCustomersData.map(customer => {
      const firstName = customer?.firstName || '';
      const lastName = customer?.lastName || '';
      const name = `${firstName} ${lastName}`.trim();

      const phone =
        customer?.phoneNumber ||
        customer?.phone ||
        'No Phone';

      let lastServiceDate = 'No service history';

      if (
        Array.isArray(customer?.services) &&
        customer.services.length > 0
      ) {
        const last =
          customer.services[customer.services.length - 1];

        if (last?.serviceDate) {
          const d = new Date(last.serviceDate);

          lastServiceDate =
            `${String(d.getDate()).padStart(2, '0')}/` +
            `${String(d.getMonth() + 1).padStart(2, '0')}/` +
            `${d.getFullYear()}`;
        }
      }

      return {
        name: name || 'No Name',
        phone,
        initials: (firstName[0] || 'N').toUpperCase(),
        lastService: lastServiceDate
      };
    })
  : [];

  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="dashboard-light-theme-wrapper">
      {/* Top Navbar Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">Dashboard</h1>
        </div>
        <div className="header-right">
          <button className="add-customer-button" onClick={() => setShowCustomer(true)}>
            <FiPlus className="plus-icon" /> Add Customer
          </button>
          {showCustomer && (
            <AddCustomerModal
              onClose={() => setShowCustomer(false)}
              onOpenVehicles={() => { setShowCustomer(false); setShowVehicle(true); }}
              onCustomerAdded={(customer) => {
                setRecentCustomersData(prev => [customer, ...prev]);
                setCustomers(prev => ({ ...prev, totalCustomers: (prev?.totalCustomers || 0) + 1 }));
              }}
            />
          )}
          {showVehicle && <AddVehicleModal onClose={() => setShowVehicle(false)} />}
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Monthly Revenue in Month — <span className="title-year">{selectedYear}</span></h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData.length ? chartData : [{month:'Jan', totalAmount:400, collected:240, pending:160}]} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tickFormatter={rupeeFormatter} tick={{ fontSize: 11, fill: '#64748b' }} width={52} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} />
              <Legend wrapperStyle={{ fontSize: 12, pt: 10 }} />
              <Bar dataKey="totalAmount" name="Total" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="pending" name="Pending" fill="#f97316" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
<div className="summary-container">
            <div className="summary-header">
              <h2 className="summary-title">Summary for</h2>
              <div className="dropdown-group">
                <select 
                  className="custom-select" 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(e.target.value)}
                >
                  <option value="All">All Months (Year)</option>
                  {MONTH_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select 
                  className="custom-select" 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="cards-grid">
              <div className="metric-card card-total">
                <span className="metric-label">Total Amount</span>
                <div className="metric-value">₹ {Number(summaryStats.totalAmount || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="metric-card card-collected">
                <span className="metric-label">Collected</span>
                <div className="metric-value">₹ {Number(summaryStats.collected || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="metric-card card-pending">
                <span className="metric-label">Pending</span>
                <div className="metric-value">₹ {Number(summaryStats.pending || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="metric-card card-new">
                <span className="metric-label">New Customers</span>
                <div className="metric-value">{Number(summaryStats.newCustomers || 0)}</div>
              </div>
            </div>
          </div>
        
      </div>

      {/* Main Container Content */}
      <div className="dashboard-content-layout">
        
        {/* TOP BLOCK GRID SPLIT (Summary Left & Counters Right) */}
        <div className="dashboard-top-split-wrapper">
          <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">New Customers <span className="title-blue">in Month</span></h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData.length ? chartData : [{month:'Jan', newCustomers:5}]} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} width={36} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="newCustomers" name="New Customers" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
          {/* LEFT: Clean Summary Infographic Cards Panel */}
          

          {/* RIGHT: Metric Round Tracks */}
          <div className="infographic-main-container">
            
            <Link to="/customers" className="infographic-card-anchor">
              <div className="infographic-glass-row info-theme--customers">
                <div className="infographic-pill-left">
                  <span className="infographic-tag">Total Customers</span>
                  <h2 className="infographic-metric">{totalCustomersCount}</h2>
                </div>
                <div className="infographic-circle-right">
                  <div className="infographic-donut-track">
                    <div className="infographic-icon-bubble">
                      <FaUserFriends className="infographic-core-icon" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/services" className="infographic-card-anchor">
              <div className="infographic-glass-row info-theme--vehicles">
                <div className="infographic-pill-left">
                  <span className="infographic-tag">Total Vehicles</span>
                  <h2 className="infographic-metric">{totalVehiclesCount}</h2>
                </div>
                <div className="infographic-circle-right">
                  <div className="infographic-donut-track">
                    <div className="infographic-icon-bubble">
                      <FaCar className="infographic-core-icon" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/services" className="infographic-card-anchor">
              <div className="infographic-glass-row info-theme--revenue">
                <div className="infographic-pill-left">
                  <span className="infographic-tag">Total Revenue</span>
                  <h2 className="infographic-metric">₹ {totalRevenueValue.toLocaleString('en-IN')}</h2>
                </div>
                <div className="infographic-circle-right">
                  <div className="infographic-donut-track">
                    <div className="infographic-icon-bubble">
                      <FaRupeeSign className="infographic-core-icon" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </div>

        {/* RECENT CUSTOMERS LIST BLOCK */}
        <div className="recent-customers">
          <div className="section-header">
            <h3 className="section-title">Recent Customers</h3>
            <Link to="/customers" className="view-all-link">View All</Link>
          </div>
          <div className="recent-customer-section">
            {recentCustomers.map((customer, idx) => (
              <div className="customer-card-section" key={idx}>
                <div className="customer-initials">{customer.initials}</div>
                <div className="customer-info">
                  <div className="customer-name">{customer.name}</div>
                  <div className="customer-phone">{customer.phone}</div>
                </div>
                <div className="customer-meta">
                  <span className="service-status-badge">Service Status</span>
                  <div className="customer-service">Last version: {customer.lastService}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;