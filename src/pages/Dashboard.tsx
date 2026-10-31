import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, XCircle, Eye, Pencil, Trash2, Plus, Download, Loader2, Share2, Search, X } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { parseDateKey } from '../utils/dates';
import { QuotationPreviewModal } from '../components/QuotationPreviewModal';
import { ShareQuotationModal } from '../components/ShareQuotationModal';
import { useQuotations, fetchFullQuotation, type Quotation } from '../hooks/useQuotations';

type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected';

const STATUS_BADGES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  converted_to_invoice: 'bg-purple-100 text-purple-700',
};

function matchesFilter(quotation: Quotation, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'pending') return quotation.status === 'sent' || quotation.status === 'draft';
  return quotation.status === filter;
}

function matchesSearch(quotation: Quotation, term: string): boolean {
  if (!term) return true;
  return [quotation.client_name, quotation.quotation_number, quotation.event_type]
    .some((value) => value.toLowerCase().includes(term));
}

function formatEventDate(dateKey: string, options?: Intl.DateTimeFormatOptions): string {
  return parseDateKey(dateKey).toLocaleDateString('en-IN', options);
}

export function Dashboard() {
  const { quotations, loading, reload, removeQuotation } = useQuotations();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [preparingShareId, setPreparingShareId] = useState<string | null>(null);
  const [previewQuotationId, setPreviewQuotationId] = useState<string | null>(null);
  const [shareQuotation, setShareQuotation] = useState<Awaited<ReturnType<typeof fetchFullQuotation>> | null>(null);

  const stats = useMemo(() => ({
    total: quotations.length,
    accepted: quotations.filter((q) => matchesFilter(q, 'accepted')).length,
    pending: quotations.filter((q) => matchesFilter(q, 'pending')).length,
    rejected: quotations.filter((q) => matchesFilter(q, 'rejected')).length,
  }), [quotations]);

  const term = search.trim().toLowerCase();
  const visibleQuotations = useMemo(
    () => quotations.filter((q) => matchesFilter(q, filter) && matchesSearch(q, term)),
    [quotations, filter, term]
  );
  const hasActiveFilters = filter !== 'all' || term !== '';

  const clearFilters = () => {
    setFilter('all');
    setSearch('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    try {
      await removeQuotation(id);
    } catch (error) {
      console.error('Error deleting quotation:', error);
      alert('Failed to delete quotation');
    }
  };

  const handleDownloadPDF = async (id: string) => {
    setDownloadingId(id);
    try {
      await generateQuotationPDF(await fetchFullQuotation(id));
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleShare = async (id: string) => {
    setPreparingShareId(id);
    try {
      setShareQuotation(await fetchFullQuotation(id));
    } catch (error) {
      console.error('Error preparing share:', error);
      alert(error instanceof Error ? error.message : 'Failed to prepare quotation for sharing');
    } finally {
      setPreparingShareId(null);
    }
  };

  const statTiles = [
    { key: 'all' as const, label: 'Total', value: stats.total, icon: FileText, border: 'border-red-900', text: 'text-gray-800', iconClass: 'text-red-900' },
    { key: 'accepted' as const, label: 'Accepted', value: stats.accepted, icon: CheckCircle, border: 'border-green-500', text: 'text-green-600', iconClass: 'text-green-500' },
    { key: 'pending' as const, label: 'Pending', value: stats.pending, icon: Clock, border: 'border-blue-500', text: 'text-blue-600', iconClass: 'text-blue-500' },
    { key: 'rejected' as const, label: 'Rejected', value: stats.rejected, icon: XCircle, border: 'border-red-500', text: 'text-red-600', iconClass: 'text-red-500' },
  ];

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <LoadingSpinner fullScreen />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="max-w-7xl mx-auto app-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          {statTiles.map((tile) => {
            const Icon = tile.icon;
            const active = filter === tile.key;
            return (
              <button
                key={tile.key}
                type="button"
                onClick={() => setFilter(tile.key)}
                aria-pressed={active}
                className={`text-left bg-white rounded-xl shadow-sm p-4 sm:p-6 border-b-4 md:border-l-4 md:border-b-0 ${tile.border} hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all ${active ? 'ring-2 ring-maroon-400' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 font-medium mb-1">{tile.label}</p>
                    <p className={`text-2xl sm:text-3xl font-bold ${tile.text}`}>{tile.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${tile.iconClass}`} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Quotations</h2>
              {hasActiveFilters && (
                <span className="text-xs text-gray-500">{visibleQuotations.length} of {quotations.length}</span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search client, number, event"
                  aria-label="Search quotations"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                />
              </div>
              <Link
                to="/admin/quotations/new"
                className="flex items-center gap-2 bg-gradient-to-r from-maroon-700 to-maroon-900 text-white px-4 py-2 rounded-lg hover:from-maroon-800 hover:to-maroon-950 active:scale-[0.98] transition-all text-sm justify-center whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                New Quotation
              </Link>
            </div>
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Quotation #', 'Client', 'Event Type', 'Event Date', 'Amount', 'Status', 'Actions'].map((heading) => (
                    <th key={heading} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <EmptyState hasQuotations={quotations.length > 0} onClear={clearFilters} />
                    </td>
                  </tr>
                ) : (
                  visibleQuotations.map((quotation) => (
                    <tr key={quotation.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {quotation.quotation_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{quotation.client_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{quotation.event_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatEventDate(quotation.event_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{quotation.grand_total.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={quotation.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <QuotationActions
                          quotationId={quotation.id}
                          isDownloading={downloadingId === quotation.id}
                          isPreparingShare={preparingShareId === quotation.id}
                          onView={setPreviewQuotationId}
                          onShare={handleShare}
                          onDownload={handleDownloadPDF}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden p-3 space-y-3">
            {visibleQuotations.length === 0 ? (
              <EmptyState hasQuotations={quotations.length > 0} onClear={clearFilters} />
            ) : (
              visibleQuotations.map((quotation) => (
                <div key={quotation.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900 truncate">{quotation.client_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{quotation.quotation_number}</p>
                    </div>
                    <StatusBadge status={quotation.status} compact />
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Event</p>
                      <p className="text-sm text-gray-900 font-semibold">{quotation.event_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Date</p>
                      <p className="text-sm text-gray-900 font-semibold">
                        {formatEventDate(quotation.event_date, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-2 mt-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Total Amount</p>
                      <p className="text-xl font-bold text-red-900">
                        ₹{quotation.grand_total.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <QuotationActions
                      quotationId={quotation.id}
                      isDownloading={downloadingId === quotation.id}
                      isPreparingShare={preparingShareId === quotation.id}
                      onView={setPreviewQuotationId}
                      onShare={handleShare}
                      onDownload={handleDownloadPDF}
                      onDelete={handleDelete}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {previewQuotationId && (
        <QuotationPreviewModal
          quotationId={previewQuotationId}
          onClose={() => setPreviewQuotationId(null)}
          onStatusChange={reload}
        />
      )}

      {shareQuotation && (
        <ShareQuotationModal
          quotation={shareQuotation}
          onClose={() => setShareQuotation(null)}
        />
      )}
    </AdminLayout>
  );
}

function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const badgeClass = STATUS_BADGES[status] || STATUS_BADGES.draft;
  return (
    <span className={`inline-block rounded-full font-medium whitespace-nowrap ${badgeClass} ${
      compact ? 'px-2.5 py-1 text-[10px] uppercase tracking-wide' : 'px-3 py-1 text-xs'
    }`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function EmptyState({ hasQuotations, onClear }: { hasQuotations: boolean; onClear: () => void }) {
  if (!hasQuotations) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="font-medium">No quotations yet</p>
        <p className="text-sm mt-1">Create your first quotation to get started.</p>
      </div>
    );
  }
  return (
    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
      <p className="font-medium">No quotations match your filters</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-maroon-700 hover:text-maroon-900"
      >
        <X className="w-4 h-4" />
        Clear filters
      </button>
    </div>
  );
}

interface QuotationActionsProps {
  quotationId: string;
  isDownloading: boolean;
  isPreparingShare: boolean;
  onView: (id: string) => void;
  onShare: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

function QuotationActions({ quotationId, isDownloading, isPreparingShare, onView, onShare, onDownload, onDelete }: QuotationActionsProps) {
  const base = 'h-9 w-9 inline-flex items-center justify-center rounded-lg transition-all active:scale-95 disabled:opacity-50 hover:bg-gray-100';
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onView(quotationId)} className={`${base} text-blue-600`} title="View" aria-label="View quotation">
        <Eye className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onShare(quotationId)}
        disabled={isPreparingShare}
        className={`${base} text-maroon-700`}
        title="Share"
        aria-label="Share quotation"
      >
        {isPreparingShare ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
      </button>
      <Link to={`/admin/quotations/${quotationId}`} className={`${base} text-maroon-600`} title="Edit" aria-label="Edit quotation">
        <Pencil className="w-4 h-4" />
      </Link>
      <button
        type="button"
        onClick={() => onDownload(quotationId)}
        disabled={isDownloading}
        className={`${base} text-green-600`}
        title="Download PDF"
        aria-label="Download PDF"
      >
        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </button>
      <button type="button" onClick={() => onDelete(quotationId)} className={`${base} text-red-600`} title="Delete" aria-label="Delete quotation">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
