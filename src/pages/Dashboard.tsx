import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, Download, Eye, FileText, Pencil, Plus, Search, Share2, Sparkles, TrendingUp, Users, XCircle, Loader2, Trash2 } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { parseDateKey } from '../utils/dates';
import { QuotationPreviewModal } from '../components/QuotationPreviewModal';
import { ShareQuotationModal } from '../components/ShareQuotationModal';
import { useQuotations, fetchFullQuotation, type Quotation } from '../hooks/useQuotations';

type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected';
const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-600', sent: 'bg-amber-50 text-amber-700', accepted: 'bg-emerald-50 text-emerald-700', rejected: 'bg-rose-50 text-rose-700', converted_to_invoice: 'bg-violet-50 text-violet-700',
};
const formatDate = (key: string, options?: Intl.DateTimeFormatOptions) => parseDateKey(key).toLocaleDateString('en-IN', options);
const matchesFilter = (q: Quotation, filter: StatusFilter) => filter === 'all' || (filter === 'pending' ? q.status === 'sent' || q.status === 'draft' : q.status === filter);
const matchesSearch = (q: Quotation, term: string) => !term || [q.client_name, q.quotation_number, q.event_type].some((value) => value.toLowerCase().includes(term));

export function Dashboard() {
  const { quotations, loading, reload, removeQuotation } = useQuotations();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [shareQuotation, setShareQuotation] = useState<Awaited<ReturnType<typeof fetchFullQuotation>> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const term = search.trim().toLowerCase();
  const visible = useMemo(() => quotations.filter((q) => matchesFilter(q, filter) && matchesSearch(q, term)), [quotations, filter, term]);
  const accepted = quotations.filter((q) => q.status === 'accepted').length;
  const pending = quotations.filter((q) => q.status === 'sent' || q.status === 'draft').length;
  const revenue = quotations.filter((q) => q.status === 'accepted').reduce((sum, q) => sum + q.grand_total, 0);

  const handleDownload = async (id: string) => { setBusy(id); try { await generateQuotationPDF(await fetchFullQuotation(id)); } catch (error) { alert(error instanceof Error ? error.message : 'Failed to generate PDF'); } finally { setBusy(null); } };
  const handleShare = async (id: string) => { setBusy(id); try { setShareQuotation(await fetchFullQuotation(id)); } catch (error) { alert(error instanceof Error ? error.message : 'Failed to prepare quotation'); } finally { setBusy(null); } };
  const handleDelete = async (id: string) => { if (!confirm('Are you sure you want to delete this quotation?')) return; try { await removeQuotation(id); } catch { alert('Failed to delete quotation'); } };

  if (loading) return <AdminLayout title="Overview"><LoadingSpinner fullScreen /></AdminLayout>;

  return <AdminLayout title="Overview">
    <div className="mx-auto max-w-[1440px] app-fade-in">
      <section className="relative isolate overflow-hidden rounded-[28px] bg-[#341318] px-5 py-7 text-white shadow-xl shadow-maroon-950/10 sm:px-8 sm:py-9 lg:px-10">
        <div className="absolute -right-16 -top-24 size-72 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 size-72 rounded-full bg-rose-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div className="max-w-xl"><div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-300"><Sparkles className="size-4" /> Your catering command center</div><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Good morning, Admin.</h2><p className="mt-3 max-w-md text-sm leading-6 text-white/65">Create memorable events and keep every quote moving forward, all from one calm workspace.</p></div>
          <Link to="/admin/quotations/new" className="inline-flex w-fit items-center gap-2 rounded-xl bg-gold-400 px-4 py-3 text-sm font-bold text-[#341318] shadow-lg shadow-black/15 transition hover:bg-gold-300 active:scale-[.98]"><Plus className="size-4" /> Create a quote <ArrowUpRight className="size-4" /></Link>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Total quotes" value={quotations.length} icon={FileText} tone="maroon" detail="All time" />
        <Metric label="Awaiting response" value={pending} icon={Clock3} tone="gold" detail="Needs attention" />
        <Metric label="Accepted quotes" value={accepted} icon={CheckCircle2} tone="green" detail="This period" />
        <Metric label="Booked revenue" value={`₹${revenue.toLocaleString('en-IN')}`} icon={TrendingUp} tone="purple" detail="From accepted" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="min-w-0 rounded-2xl border border-stone-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex items-center gap-2"><h3 className="text-lg font-semibold text-stone-900">Recent quotations</h3><span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">{visible.length}</span></div><p className="mt-1 text-sm text-stone-500">Track your latest proposals and follow-ups.</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quotes" aria-label="Search quotations" className="h-10 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm outline-none transition focus:border-maroon-400 focus:ring-2 focus:ring-maroon-100 sm:w-52" /></label><Link to="/admin/quotations/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-maroon-700 px-4 text-sm font-semibold text-white transition hover:bg-maroon-800 active:scale-[.98]"><Plus className="size-4" /> New quote</Link></div></div>
          <div className="flex gap-2 overflow-x-auto px-5 py-4 sm:px-6">{(['all', 'pending', 'accepted', 'rejected'] as StatusFilter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${filter === item ? 'bg-maroon-700 text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>{item}</button>)}</div>
          {visible.length === 0 ? <EmptyState hasQuotes={quotations.length > 0} onClear={() => { setFilter('all'); setSearch(''); }} /> : <div className="divide-y divide-stone-100">{visible.map((q) => <QuoteRow key={q.id} quotation={q} busy={busy === q.id} onView={setPreviewId} onShare={handleShare} onDownload={handleDownload} onDelete={handleDelete} />)}</div>}
          <div className="border-t border-stone-100 p-4 text-center"><Link to="/admin/analytics" className="text-sm font-semibold text-maroon-700 hover:text-maroon-900">View performance overview <ArrowUpRight className="ml-1 inline size-4" /></Link></div>
        </section>
        <aside className="space-y-6"><div className="rounded-2xl border border-stone-200/80 bg-[#faf8f5] p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-stone-900">Quick actions</p><p className="mt-1 text-xs text-stone-500">Keep your workflow moving</p></div><Sparkles className="size-5 text-gold-500" /></div><div className="mt-4 grid gap-2">{[[FileText, 'Build a quotation', '/admin/quotations/new'], [Users, 'Manage clients', '/admin/clients'], [CalendarDays, 'View calendar', '/admin/calendar']].map(([Icon, label, href]) => { const ActionIcon = Icon as typeof FileText; return <Link key={label as string} to={href as string} className="group flex items-center gap-3 rounded-xl bg-white p-3 text-sm font-medium text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="flex size-9 items-center justify-center rounded-lg bg-maroon-50 text-maroon-700"><ActionIcon className="size-4" /></span>{label as string}<ArrowUpRight className="ml-auto size-4 text-stone-300 transition group-hover:text-maroon-700" /></Link>; })}</div></div><div className="rounded-2xl bg-gradient-to-br from-gold-50 to-orange-50 p-5"><div className="flex items-center gap-2 text-gold-700"><TrendingUp className="size-4" /><span className="text-xs font-bold uppercase tracking-wider">Your momentum</span></div><p className="mt-4 text-2xl font-semibold text-stone-900">{accepted > 0 ? 'Great work!' : 'Ready when you are.'}</p><p className="mt-2 text-sm leading-5 text-stone-600">{accepted > 0 ? `${accepted} accepted ${accepted === 1 ? 'quote is' : 'quotes are'} helping your business grow.` : 'Create your first quote and start building your pipeline.'}</p></div></aside>
      </div>
    </div>
    {previewId && <QuotationPreviewModal quotationId={previewId} onClose={() => setPreviewId(null)} onStatusChange={reload} />}
    {shareQuotation && <ShareQuotationModal quotation={shareQuotation} onClose={() => setShareQuotation(null)} />}
  </AdminLayout>;
}

function Metric({ label, value, icon: Icon, tone, detail }: { label: string; value: string | number; icon: typeof FileText; tone: string; detail: string }) { const tones: Record<string, string> = { maroon: 'bg-maroon-50 text-maroon-700', gold: 'bg-gold-50 text-gold-700', green: 'bg-emerald-50 text-emerald-700', purple: 'bg-violet-50 text-violet-700' }; return <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-2"><span className={`flex size-9 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="size-4" /></span><span className="text-[11px] font-medium text-stone-400">{detail}</span></div><p className="mt-4 truncate text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">{value}</p><p className="mt-1 text-xs font-medium text-stone-500 sm:text-sm">{label}</p></div>; }
function QuoteRow({ quotation: q, busy, onView, onShare, onDownload, onDelete }: { quotation: Quotation; busy: boolean; onView: (id: string) => void; onShare: (id: string) => void; onDownload: (id: string) => void; onDelete: (id: string) => void }) { return <div className="group flex flex-col gap-4 px-5 py-4 transition hover:bg-stone-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-maroon-50 text-maroon-700 sm:flex"><FileText className="size-4" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-stone-900">{q.client_name}</p><p className="mt-1 truncate text-xs text-stone-500">{q.quotation_number} · {q.event_type} · {formatDate(q.event_date, { day: 'numeric', month: 'short' })}</p></div></div><div className="flex items-center justify-between gap-4 sm:justify-end"><div className="text-left sm:text-right"><p className="text-sm font-semibold text-stone-900">₹{q.grand_total.toLocaleString('en-IN')}</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${STATUS_STYLES[q.status] || STATUS_STYLES.draft}`}>{q.status.replace(/_/g, ' ')}</span></div><div className="flex items-center gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><button type="button" onClick={() => onView(q.id)} aria-label="View quotation" className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-maroon-700"><Eye className="size-4" /></button><button type="button" onClick={() => onShare(q.id)} disabled={busy} aria-label="Share quotation" className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-maroon-700">{busy ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}</button><Link to={`/admin/quotations/${q.id}`} aria-label="Edit quotation" className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-maroon-700"><Pencil className="size-4" /></Link><button type="button" onClick={() => onDownload(q.id)} disabled={busy} aria-label="Download quotation" className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-maroon-700"><Download className="size-4" /></button><button type="button" onClick={() => onDelete(q.id)} aria-label="Delete quotation" className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-rose-600"><Trash2 className="size-4" /></button></div></div></div>; }
function EmptyState({ hasQuotes, onClear }: { hasQuotes: boolean; onClear: () => void }) { return <div className="p-10 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400"><XCircle className="size-5" /></div><p className="mt-3 text-sm font-semibold text-stone-700">{hasQuotes ? 'No quotes match your filters' : 'No quotations yet'}</p><p className="mt-1 text-xs text-stone-500">{hasQuotes ? 'Try adjusting your search or status.' : 'Create your first quotation to get started.'}</p>{hasQuotes && <button type="button" onClick={onClear} className="mt-3 text-xs font-semibold text-maroon-700">Clear filters</button>}</div>; }
