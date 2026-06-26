import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, MapPin, Star } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { getVendors } from '../api/vendors';
import { getStatusBadge } from '../utils/formatters';
import Skeleton from '../components/ui/Skeleton';

const Vendors = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      const data = await getVendors();
      setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 skeleton rounded-card" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Vendor Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendors.map((vendor, index) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start justify-between rounded-lg border border-border bg-bg-elevated/50 p-4 hover:bg-bg-elevated"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-text-primary">{vendor.companyName}</h3>
                    <Badge variant={vendor.status === 'ACTIVE' ? 'success' : 'default'}>
                      {getStatusBadge(vendor.status)}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Mail size={14} />
                      {vendor.contactEmail}
                    </div>
                    {vendor.phone && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Phone size={14} />
                        {vendor.phone}
                      </div>
                    )}
                    {vendor.address && (
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <MapPin size={14} />
                        {vendor.address}
                      </div>
                    )}
                    {vendor.category && (
                      <div className="text-xs text-text-muted">
                        Category: {vendor.category}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 text-sm text-text-secondary">
                    <Star size={14} className="text-warning" />
                    <span>{vendor.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="text-xs text-text-muted">
                    {vendor._count?.quotations || 0} quotations
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Vendors;
