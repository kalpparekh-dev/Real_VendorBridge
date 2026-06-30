import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Star, Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../api/vendors';
import { getStatusBadge } from '../utils/formatters';

const Vendors = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    phone: '',
    address: '',
    category: '',
    status: 'ACTIVE',
    rating: 0,
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await getVendors();
      setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactName: '',
      contactEmail: '',
      phone: '',
      address: '',
      category: '',
      status: 'ACTIVE',
      rating: 0,
    });
    setEditingVendor(null);
    setShowForm(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: name === 'rating' ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingVendor) {
        await updateVendor(editingVendor.id, formData);
      } else {
        await createVendor(formData);
      }

      await loadVendors();
      resetForm();
    } catch (error: any) {
  console.error('Error saving vendor:', error);

  if (error.response?.status === 409) {
    alert('Vendor already exists. Please use a different email or company name.');
  } else {
    alert(error.response?.data?.message || 'Failed to save vendor.');
  }
}
  };

  const handleEdit = (vendor: any) => {
    setEditingVendor(vendor);
    setFormData({
      companyName: vendor.companyName || '',
      contactName: vendor.contactName || '',
      contactEmail: vendor.contactEmail || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      category: vendor.category || '',
      status: vendor.status || 'ACTIVE',
      rating: vendor.rating || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this vendor?');

    if (!confirmDelete) return;

    try {
      await deleteVendor(id);
      await loadVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert('Failed to delete vendor.');
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const keyword = search.toLowerCase();

    return (
      vendor.companyName?.toLowerCase().includes(keyword) ||
      vendor.contactEmail?.toLowerCase().includes(keyword) ||
      vendor.category?.toLowerCase().includes(keyword)
    );
  });

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
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Vendor Management</CardTitle>

            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Plus size={16} />
              Add Vendor
            </button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
            <Search size={16} className="text-text-muted" />
            <input
              type="text"
              placeholder="Search vendors by company, email or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 rounded-lg border border-border bg-bg-elevated/60 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-text-primary">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h3>

                <button
                  type="button"
                  onClick={resetForm}
                  className="text-text-muted hover:text-text-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Company Name"
                  required
                  className="rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none"
                />

                <input
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="Contact Person"
                  className="rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none"
                />

                <input
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="Email"
                  type="email"
                  required
                  className="rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none"
                />

                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none"
                />

                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Address"
                  className="rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none"
                />

                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Category"
                  className="rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none"
                />

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>

                <input
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  placeholder="Rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  className="rounded-lg border border-border bg-bg-base px-3 py-2 text-sm text-text-primary outline-none"
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  {editingVendor ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
          )}

          {filteredVendors.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-text-muted">
              No vendors found. Click “Add Vendor” to create your first vendor.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVendors.map((vendor, index) => (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start justify-between rounded-lg border border-border bg-bg-elevated/50 p-4 hover:bg-bg-elevated"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-medium text-text-primary">
                        {vendor.companyName}
                      </h3>

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

                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                      <Star size={14} className="text-warning" />
                      <span>{vendor.rating?.toFixed(1) || 'N/A'}</span>
                    </div>

                    <div className="text-xs text-text-muted">
                      {vendor._count?.quotations || 0} quotations
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(vendor)}
                        className="rounded-lg border border-border p-2 text-text-secondary hover:text-text-primary"
                        title="Edit Vendor"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() => handleDelete(vendor.id)}
                        className="rounded-lg border border-border p-2 text-danger hover:text-red-400"
                        title="Delete Vendor"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Vendors;