import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  Archive,
  CreditCard,
  ShoppingCart,
  Receipt,
  Building2,
  Users,
  Package,
  ReceiptIndianRupee,
  CheckCircle2,
  Sparkles,
  Calendar,
  Layers,
  ArrowDownToLine
} from 'lucide-react';
import {
  CardMember,
  CardTransaction,
  Customer,
  Dealer,
  DealerPayment,
  PurchaseEntry,
  StockItem,
  TransactionEntry,
} from '../types';
import {
  downloadCsvFile,
  generateCardReceiptsCsv,
  generateCustomerKhataCsv,
  generateDealerLedgersCsv,
  generateDealerPaymentsCsv,
  generateExpensesCsv,
  generatePurchasesCsv,
  generateSalesInvoicesCsv,
  generateSchemeCardsCsv,
  generateStockCsv,
  exportAllDataAsZip,
} from '../utils/csvExport';

interface CsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardMembers: CardMember[];
  cardTransactions: CardTransaction[];
  transactions: TransactionEntry[];
  purchases: PurchaseEntry[];
  dealers: Dealer[];
  dealerPayments: DealerPayment[];
  customers: Customer[];
  stock?: StockItem[];
  expenses?: any[];
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({
  isOpen,
  onClose,
  cardMembers,
  cardTransactions,
  transactions,
  purchases,
  dealers,
  dealerPayments,
  customers,
  stock = [],
  expenses = [],
}) => {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [lastDownloaded, setLastDownloaded] = useState<string | null>(null);

  if (!isOpen) return null;

  const scheme1Cards = cardMembers.filter((m) => m.schemeId === 'scheme1');
  const scheme2Cards = cardMembers.filter((m) => m.schemeId === 'scheme2');
  const scheme3Cards = cardMembers.filter((m) => m.schemeId === 'scheme3');

  const handleDownloadScheme1 = () => {
    const { filename, csv } = generateSchemeCardsCsv(cardMembers, 'scheme1');
    downloadCsvFile(filename, csv);
    setLastDownloaded(filename);
  };

  const handleDownloadScheme2 = () => {
    const { filename, csv } = generateSchemeCardsCsv(cardMembers, 'scheme2');
    downloadCsvFile(filename, csv);
    setLastDownloaded(filename);
  };

  const handleDownloadScheme3 = () => {
    const { filename, csv } = generateSchemeCardsCsv(cardMembers, 'scheme3');
    downloadCsvFile(filename, csv);
    setLastDownloaded(filename);
  };

  const handleDownloadAllCards = () => {
    const { filename, csv } = generateSchemeCardsCsv(cardMembers);
    downloadCsvFile(filename, csv);
    setLastDownloaded(filename);
  };

  const handleDownloadSales = () => {
    const { filename, csv } = generateSalesInvoicesCsv(transactions);
    downloadCsvFile(filename, csv);
    setLastDownloaded(filename);
  };

  const handleDownloadPurchases = () => {
    const { filename, csv } = generatePurchasesCsv(purchases);
    downloadCsvFile(filename, csv);
    setLastDownloaded(filename);
  };

  const handleDownloadReceipts = () => {
    const { filename, csv } = generateCardReceiptsCsv(cardTransactions);
    downloadCsvFile(filename, csv);
    setLastDownloaded(filename);
  };

  const handleDownloadDealerLedgers = () => {
    const { filename, csv } = generateDealerLedgersCsv(dealers);
    downloadCsvFile(filename, csv);
    setLastDownloaded(filename);
  };

  const handleDownloadDealerPayments = () => {
    const { filename, csv } = generateDealerPaymentsCsv(dealerPayments);
    downloadCsvFile(filename, csv);
    setLastDownloaded(filename);
  };

  const handleDownloadCustomerKhata = () => {
    const { filename, csv } = generateCustomerKhataCsv(customers);
    downloadCsvFile(filename, csv);
    setLastDownloaded(filename);
  };

  const handleDownloadStock = () => {
    const { filename, csv } = generateStockCsv(stock);
    downloadCsvFile(filename, csv);
    setLastDownloaded(filename);
  };

  const handleDownloadExpenses = () => {
    const { filename, csv } = generateExpensesCsv(expenses);
    downloadCsvFile(filename, csv);
    setLastDownloaded(filename);
  };

  const handleDownloadAllZip = async () => {
    try {
      setDownloadingZip(true);
      await exportAllDataAsZip({
        cardMembers,
        cardTransactions,
        transactions,
        purchases,
        dealers,
        dealerPayments,
        customers,
        stock,
        expenses,
      });
      setLastDownloaded('All CSVs (ZIP Archive)');
    } catch (err) {
      console.error('Failed to export zip:', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>मॅन्युअल डेटा CSV एक्सपोर्ट (Manual CSV Export)</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Excel UTF-8 Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                योजना १, २, ३, विक्री बिले, खरीद, पावती व लेजर नोंदी CSV स्वरूपात थेट डाऊनलोड करा.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Last Download Notification */}
          {lastDownloaded && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  डाउनलोड यशस्वी: <strong>{lastDownloaded}</strong> (Excel & Google Sheets सुसंगत)
                </span>
              </span>
              <button
                onClick={() => setLastDownloaded(null)}
                className="text-emerald-700 dark:text-emerald-400 hover:underline text-[11px] font-semibold"
              >
                बंद करा
              </button>
            </div>
          )}

          {/* Master 1-Click ZIP Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#00523f] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                  All-In-One Bundle
                </span>
                <span className="text-xs text-emerald-100 font-medium">संपूर्ण बॅकअप पॅकेज</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">सर्व फाइल्स एकाच क्लिकवर डाऊनलोड करा (.ZIP)</h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Scheme 1, 2, 3 + विक्री + खरेदी + पावती + डीलर लेजरच्या १२ स्वतंत्र CSV फाइल्स
              </p>
            </div>
            <button
              onClick={handleDownloadAllZip}
              disabled={downloadingZip}
              className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 active:scale-95"
            >
              <Archive className="w-4 h-4" />
              {downloadingZip ? 'तयार होत आहे...' : 'Download All CSVs (ZIP Archive)'}
            </button>
          </div>

          {/* Section 1: Scheme Cards (योजना १, २, ३) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>१. योजना कार्ड्स (Scheme Cards 1, 2, 3)</span>
              </h4>
              <button
                onClick={handleDownloadAllCards}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                सर्व योजना एकत्र ({cardMembers.length} कार्ड्स)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Scheme 1 */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3 hover:border-blue-400 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                      Scheme 1
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {scheme1Cards.length} कार्ड्स
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm mt-2">योजना १ (1001 - 2999)</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    ग्राहक नाव, मोबाईल, गाव, जमा व परतावा रक्कम
                  </p>
                </div>
                <button
                  onClick={handleDownloadScheme1}
                  className="w-full py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Scheme 1 CSV
                </button>
              </div>

              {/* Scheme 2 */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3 hover:border-amber-400 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      Scheme 2
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {scheme2Cards.length} कार्ड्स
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm mt-2">योजना २ (3001 - 3999)</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    कार्डधारक यादी, शिल्लक व हप्ता तपशील
                  </p>
                </div>
                <button
                  onClick={handleDownloadScheme2}
                  className="w-full py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Scheme 2 CSV
                </button>
              </div>

              {/* Scheme 3 */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3 hover:border-emerald-400 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      Scheme 3
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {scheme3Cards.length} कार्ड्स
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm mt-2">योजना ३ (4001 - 6000)</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    नवीनतम साप्ताहिक कार्डधारक व खाती
                  </p>
                </div>
                <button
                  onClick={handleDownloadScheme3}
                  className="w-full py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Scheme 3 CSV
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Sales, Purchases, Receipts (विक्री, खरेदी, पावती) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>२. दैनंदिन व्यवहार, विक्री व खरेदी (Sales, Purchases & Receipts)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Sales Invoices */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3 hover:border-emerald-400 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      विक्री नोंदी
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {transactions.length} बिले
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm mt-2">Sales & Invoices</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    सर्व ग्राहक बिले, एकूण रक्कम, जमा रोख, उधारी बाकी व साहित्य
                  </p>
                </div>
                <button
                  onClick={handleDownloadSales}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Sales Invoices CSV
                </button>
              </div>

              {/* Purchases */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3 hover:border-blue-400 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                      खरेदी आवक
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {purchases.length} इनव्हॉइस
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm mt-2">Purchases (Supplier Bills)</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Manisha Enterprises व इतर डीलर्सची खरीद बिले व देय रक्कम
                  </p>
                </div>
                <button
                  onClick={handleDownloadPurchases}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Purchases CSV
                </button>
              </div>

              {/* Card Scheme Receipts */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3 hover:border-purple-400 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                      पावत्या
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {cardTransactions.length} पावत्या
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm mt-2">Scheme Receipts (जमा पावत्या)</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    आठवडे हप्ता पावती क्र., तारीख, रक्कम व शिल्लक हिशोब
                  </p>
                </div>
                <button
                  onClick={handleDownloadReceipts}
                  className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Receipts CSV
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Ledgers, Udhar & Dealer Khata */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>३. खातेवही व उधारी (Ledgers & Udhar Khata)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Dealer Ledgers */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3 hover:border-blue-400 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                      डीलर खाते
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {dealers.length} डीलर्स
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm mt-2">Dealer Ledgers (डीलर खातेवही)</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    एकूण माल खरेदी, दिलेली रक्कम आणि देणे बाकी शिल्लक
                  </p>
                </div>
                <button
                  onClick={handleDownloadDealerLedgers}
                  className="w-full py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Dealer Ledgers CSV
                </button>
              </div>

              {/* Dealer Payments */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3 hover:border-emerald-400 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      डीलर पेमेंट
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {dealerPayments.length} व्हाउचर्स
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm mt-2">Dealer Payment Vouchers</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    डीलर्सना दिलेली पेमेंट, व्हाउचर्स व बँक UTR तपशील
                  </p>
                </div>
                <button
                  onClick={handleDownloadDealerPayments}
                  className="w-full py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Payment Vouchers CSV
                </button>
              </div>

              {/* Customer Khata */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between space-y-3 hover:border-amber-400 transition">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      उधारी खाते
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {customers.length} ग्राहक
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm mt-2">Customer Udhar Khata</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    ग्राहकांचे उधारी खाते, देणे बाकी व संपर्क तपशील
                  </p>
                </div>
                <button
                  onClick={handleDownloadCustomerKhata}
                  className="w-full py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Customer Khata CSV
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Stock & Expenses */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Package className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>४. स्टॉक व दुकान खर्च (Stock & Expenses)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Stock */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">Stock & Inventory ({stock.length} वस्तू)</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    मालाची शिल्लक, खरेदी व विक्री भाव
                  </p>
                </div>
                <button
                  onClick={handleDownloadStock}
                  className="py-1.5 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Stock CSV
                </button>
              </div>

              {/* Expenses */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">Shop Expenses ({expenses.length} नोंदी)</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    दुकान खर्च, भाडे, वाहतूक व दैनंदिन खर्च
                  </p>
                </div>
                <button
                  onClick={handleDownloadExpenses}
                  className="py-1.5 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Expenses CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>सर्व CSV फाइल्स मध्ये Microsoft Excel आणि Google Sheets साठी UTF-8 BOM समाविष्ट आहे.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition cursor-pointer self-end sm:self-auto"
          >
            बंद करा (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
