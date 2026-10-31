import { useState } from 'react';
import { X, MessageCircle, Mail, Share2, Link2, Check, Download } from 'lucide-react';
import { createQuotationPDFFile, generateQuotationPDF } from '../utils/pdfGenerator';

type ShareableQuotation = Parameters<typeof generateQuotationPDF>[0] & {
  id: string;
};

interface ShareQuotationModalProps {
  quotation: ShareableQuotation;
  onClose: () => void;
}

function canShareFiles(): boolean {
  return typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [new File([''], 'probe.pdf', { type: 'application/pdf' })] });
}

function buildShareLink(quotationId: string): string {
  return `${window.location.origin}/quotation/${quotationId}`;
}

function buildMessage(quotation: ShareableQuotation, link: string): string {
  const total = `₹${quotation.grand_total.toLocaleString('en-IN')}`;
  return `Hello ${quotation.client_name}, here is your quotation ${quotation.quotation_number} for ${quotation.event_type} (${quotation.number_of_guests} guests).\n\nTotal: ${total}\nValid for ${quotation.validity_days} days.\n\nView and respond online: ${link}`;
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function ShareQuotationModal({ quotation, onClose }: ShareQuotationModalProps) {
  const [supportsFileShare] = useState(canShareFiles);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const link = buildShareLink(quotation.id);
  const message = buildMessage(quotation, link);

  const openWhatsApp = () => {
    const number = whatsappNumber(quotation.client_phone);
    const base = number ? `https://wa.me/${number}` : 'https://wa.me/';
    window.open(`${base}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const openEmail = () => {
    const subject = `Quotation ${quotation.quotation_number} - ${quotation.event_type}`;
    const to = quotation.client_email ? encodeURIComponent(quotation.client_email) : '';
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice('Could not copy automatically. Please copy the link manually.');
    }
  };

  const sharePdfFile = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const file = await createQuotationPDFFile(quotation);
      if (!navigator.canShare({ files: [file] })) {
        downloadFile(file);
        setNotice('Your device cannot attach files here, so the PDF was downloaded instead.');
        return;
      }
      await navigator.share({
        files: [file],
        title: `Quotation ${quotation.quotation_number}`,
        text: message,
      });
      onClose();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Error sharing quotation:', error);
      setNotice('Sharing failed. Please try again or use another option.');
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await generateQuotationPDF(quotation);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setNotice('Failed to generate PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const channels = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      description: 'Send a message with a link to the quotation',
      icon: MessageCircle,
      iconClass: 'bg-green-100 text-green-700',
      onClick: openWhatsApp,
    },
    {
      key: 'email',
      label: 'Email',
      description: quotation.client_email ? `Email to ${quotation.client_email}` : 'Open your email app with the quotation message',
      icon: Mail,
      iconClass: 'bg-blue-100 text-blue-700',
      onClick: openEmail,
    },
    {
      key: 'copy',
      label: copied ? 'Link copied' : 'Copy link',
      description: 'Paste the quotation link into any app or chat',
      icon: copied ? Check : Link2,
      iconClass: 'bg-maroon-100 text-maroon-700',
      onClick: copyLink,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-maroon-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h3 className="text-xl font-bold">Share Quotation</h3>
            <p className="text-maroon-200 text-sm">{quotation.quotation_number}</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-maroon-200 transition-colors" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {supportsFileShare && (
            <button
              onClick={sharePdfFile}
              disabled={busy}
              className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg text-left hover:border-maroon-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-maroon-100 text-maroon-700">
                <Share2 className="w-5 h-5" />
              </span>
              <span>
                <span className="block font-semibold text-gray-800">{busy ? 'Preparing PDF...' : 'Send PDF file'}</span>
                <span className="block text-sm text-gray-600">Attach the PDF in any app on this device</span>
              </span>
            </button>
          )}

          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <button
                key={channel.key}
                onClick={channel.onClick}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg text-left hover:border-maroon-300 hover:bg-gray-50 transition-colors"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-full ${channel.iconClass}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span>
                  <span className="block font-semibold text-gray-800">{channel.label}</span>
                  <span className="block text-sm text-gray-600">{channel.description}</span>
                </span>
              </button>
            );
          })}

          <button
            onClick={downloadPdf}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download PDF instead
          </button>

          {notice && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{notice}</p>
          )}
        </div>
      </div>
    </div>
  );
}
