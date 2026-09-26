import React, { useState } from 'react';
import {
  HardDriveDownload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  ShieldCheck,
  Upload,
  Calendar,
  Sparkles,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StoreData } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface DailyBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeData: StoreData;
  onRefreshData?: () => void;
}

export const DailyBackupModal: React.FC<DailyBackupModalProps> = ({
  isOpen,
  onClose,
  storeData,
  onRefreshData,
}) => {
  const { isDayMode } = useTheme();

  const [downloadSuccess, setDownloadSuccess] = useState<string>('');
  const [lastBackup, setLastBackup] = useState<string>(
    storeData.lastBackupDate || localStorage.getItem('sse_last_backup_time') || ''
  );

  if (!isOpen) return null;

  const nowStr = new Date().toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const stampBackupDone = () => {
    setLastBackup(nowStr);
    storeData.lastBackupDate = nowStr;
    try {
      localStorage.setItem('sse_last_backup_time', nowStr);
      localStorage.setItem('sse_store_data', JSON.stringify(storeData));
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Download Full JSON Backup
  const handleDownloadJsonBackup = () => {
    const today = new Date().toISOString().split('T')[0];
    const dataStr = JSON.stringify(storeData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Shri_Sai_Enterprises_Complete_Backup_${today}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    stampBackupDone();
    setDownloadSuccess('JSON संपूर्ण डेटाबेस बॅकअप यशस्वीरित्या डाऊनलोड झाला!');
    setTimeout(() => setDownloadSuccess(''), 4000);
  };

  // 2. Download Multi-Sheet Excel (.xlsx) Backup
  const handleDownloadExcelBackup = () => {
    const today = new Date().toISOString().split('T')[0];
    const wb = XLSX.utils.book_new();

    // Sheet 1: Customers
    const custData = storeData.customers.map((c) => ({
      'Customer ID': c.id,
      'Name': c.name,
      'Phone': c.phone,
      'Village': c.village || '',
      'Address': c.address,
      'Current Balance (उधारी)': c.currentBalance,
      'Credit Limit': c.creditLimit,
      'Total Purchased': c.totalPurchased,
    }));
    const wsCust = XLSX.utils.json_to_sheet(custData);
    XLSX.utils.book_append_sheet(wb, wsCust, 'Customers (ग्राहक)');

    // Sheet 2: 30-Month Scheme Cards
    const cardData = storeData.cardMembers.map((m) => ({
      'Card No': m.cardNo,
      'Member Name': m.memberName,
      'Phone': m.phone,
      'Village': m.village || m.address,
      'Status': m.status,
      'Total Paid (एकूण जमा)': m.totalAmountPaid || m.totalPaid || 0,
      'Weekly Fee': m.monthlyAmount || 100,
      'Agent': m.collectedBy || '',
    }));
    const wsCards = XLSX.utils.json_to_sheet(cardData);
    XLSX.utils.book_append_sheet(wb, wsCards, 'Card Members (योजना सभासद)');

    // Sheet 3: Sales Invoices
    const txData = storeData.transactions.map((t) => ({
      'Invoice No': t.invoiceNo,
      'Date': t.date,
      'Customer': t.customerName,
      'Phone': t.customerPhone,
      'Grand Total': t.grandTotal,
      'Paid Amount': t.paidAmount,
      'Balance Due': t.balanceDue,
      'Payment Mode': t.paymentMode,
      'Delivery Status': t.deliveryStatus,
    }));
    const wsTx = XLSX.utils.json_to_sheet(txData);
    XLSX.utils.book_append_sheet(wb, wsTx, 'Sales Invoices (विक्री बिले)');

    // Sheet 4: Inventory
    const stockData = storeData.stock.map((s) => ({
      'Code/SKU': s.code,
      'Product Name': s.name,
      'Category': s.category,
      'Brand': s.brand,
      'Model': s.model,
      'Stock Qty': s.stockQty,
      'Purchase Price': s.purchasePrice,
      'Sale Price': s.salePrice,
      'MRP': s.mrp,
    }));
    const wsStock = XLSX.utils.json_to_sheet(stockData);
    XLSX.utils.book_append_sheet(wb, wsStock, 'Stock Inventory (स्टॉक)');

    // Sheet 5: Day Closings
    if (storeData.dailyClosings && storeData.dailyClosings.length > 0) {
      const closingData = storeData.dailyClosings.map((dc) => ({
        'Date': dc.date,
        'Expected Cash': dc.expectedCash,
        'Actual Cash': dc.actualCash,
        'Discrepancy (तूट)': dc.discrepancy,
        'Status': dc.status,
        'Cashier': dc.closedBy,
      }));
      const wsClosing = XLSX.utils.json_to_sheet(closingData);
      XLSX.utils.book_append_sheet(wb, wsClosing, 'Cash Closings (गल्ला बंद)');
    }

    XLSX.writeFile(wb, `Shri_Sai_Enterprises_Excel_Backup_${today}.xlsx`);

    stampBackupDone();
    setDownloadSuccess('एक्सेल (.xlsx) मल्टी-शीट बॅकअप यशस्वीरित्या डाऊनलोड झाला!');
    setTimeout(() => setDownloadSuccess(''), 4000);
  };

  // 3. Restore from Backup
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.customers && parsed.transactions && parsed.stock) {
          localStorage.setItem('sse_store_data', JSON.stringify(parsed));
          setDownloadSuccess('✅ बॅकअप डेटा यशस्वीरित्या रिस्टोअर झाला!');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          alert('अवैध बॅकअप फाइल (Invalid Backup File)');
        }
      } catch (err) {
        alert('फाइल वाचताना त्रुटी आली. कृपया अचूक JSON बॅकअप निवडा.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-5 ${
        isDayMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black">
              <HardDriveDownload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-playfair text-slate-900 dark:text-white">
                रोज रात्री १-क्लिक सुरक्षित स्थानिक बॅकअप
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Daily Night Auto-Backup & Offline Vault
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${lastBackup ? 'text-emerald-500' : 'text-amber-500'}`} />
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                शेवटचा सुरक्षित बॅकअप:
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {lastBackup || 'आज अद्याप बॅकअप घेतला नाही'}
              </span>
            </div>
          </div>
          {lastBackup && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              सुरक्षित (Protected)
            </span>
          )}
        </div>

        {downloadSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Backup Action Cards */}
        <div className="space-y-3">
          {/* Complete JSON Backup Button */}
          <button
            onClick={handleDownloadJsonBackup}
            className="w-full p-4 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 hover:shadow-md transition cursor-pointer flex items-center justify-between text-left group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 group-hover:scale-105 transition">
                <HardDriveDownload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  १. संपूर्ण JSON डेटाबेस बॅकअप (Recommended)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ग्राहकांचे खाते, विक्री बिले, ३०-महिने योजना, स्टॉक आणि गल्ला रेकॉर्ड एका फाईलमध्ये.
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">
              डाऊनलोड →
            </span>
          </button>

          {/* Excel Multi-Sheet Backup */}
          <button
            onClick={handleDownloadExcelBackup}
            className="w-full p-4 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 hover:shadow-md transition cursor-pointer flex items-center justify-between text-left group active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white group-hover:scale-105 transition">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  २. एक्सेल (.xlsx) मल्टी-शीट बॅकअप
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  कॉम्प्युटर किंवा मोबाईलमध्ये MS Excel द्वारे ऑफलाईन उघडून पाहण्यासाठी.
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              डाऊनलोड →
            </span>
          </button>
        </div>

        {/* Restore Section */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>जुनी बॅकअप फाइल पूर्ववत करायची आहे?</span>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>बॅकअप रिस्टोअर करा</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
