import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { getSpendByCategory, getRFQVolume, getVendorPerformance } from '../api/reports';
import { formatCurrency } from '../utils/formatters';
import Skeleton from '../components/ui/Skeleton';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [spendData, setSpendData] = useState<any[]>([]);
  const [rfqVolumeData, setRfqVolumeData] = useState<any[]>([]);
  const [vendorPerformance, setVendorPerformance] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [spend, volume, performance] = await Promise.all([
        getSpendByCategory(),
        getRFQVolume(),
        getVendorPerformance(),
      ]);
      setSpendData(spend);
      setRfqVolumeData(volume);
      setVendorPerformance(performance);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardContent className="p-6"><Skeleton className="h-80" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-80" /></CardContent></Card>
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64" /></CardContent></Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spend by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RFQ Volume */}
        <Card>
          <CardHeader>
            <CardTitle>RFQ Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rfqVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--accent)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Avg Delivery Days</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Total POs</TableHead>
                <TableHead>On-Time %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorPerformance.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium text-text-primary">{vendor.companyName}</TableCell>
                  <TableCell>{vendor.avgDeliveryDays}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-bg-elevated">
                        <div
                          className="h-2 rounded-full bg-accent"
                          style={{ width: `${(vendor.avgScore / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-text-secondary">{vendor.avgScore.toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{vendor.totalPOs}</TableCell>
                  <TableCell>{vendor.onTimePercent}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Reports;
