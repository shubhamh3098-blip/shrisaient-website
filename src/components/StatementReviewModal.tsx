import React, { useState, useId } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowUpDown,
  Building2,
  Calculator,
  Loader2
} from 'lucide-react';
import { Dealer } from '../types';

export interface StatementParsedRow {
  id: string;
  date: string;
  particulars: string;
  vchType: 'Purchase' | 'Payment' | 'Journal' | 'Receipt';
  vchNo?: string;
  debit: number;
  credit: number;
  balance?: number;
}

interface StatementReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealers: Dealer[];
  onAddDealer?: (dealer: Omit<Dealer, 'id'>) => void;
  onImportStatementEntries: (
    dealerId: string,
    dealerName: string,
    entries: StatementParsedRow[]
  ) => void;
}

export const StatementReviewModal: React.FC<StatementReviewModalProps> = ({
  isOpen,
  onClose,
  dealers,
  onAddDealer,
  onImportStatementEntries,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [detectedPartyName, setDetectedPartyName] = useState<string>('');
  const [selectedDealerId, setSelectedDealerId] = useState<string>('');
  const [newDealerNameInput, setNewDealerNameInput] = useState<string>('');
  const [rows, setRows] = useState<StatementParsedRow[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle File Upload & Trigger OCR
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorBanner(null);
    setIsProcessing(true);
    setStatusMessage('दस्तऐवज स्कॅन करत आहे (Analyzing PDF/Image with OCR)...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = (reader.result as string) || '';
          const response = await fetch('/api/parse-party-statement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64Content,
              mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
              fileName: file.name,
            }),
          });

          const resData = await response.json();

          if (response.ok && resData?.data) {
            const data = resData.data;
            const extractedParty = data.partyName || '';
            setDetectedPartyName(extractedParty);

            // Auto-match dealer if possible
            if (extractedParty && dealers.length > 0) {
              const matched = dealers.find(
                (d) =>
                  d.name.toLowerCase().includes(extractedParty.toLowerCase()) ||
                  extractedParty.toLowerCase().includes(d.name.toLowerCase())
              );
              if (matched) {
                setSelectedDealerId(matched.id);
              } else {
                setNewDealerNameInput(extractedParty);
              }
            }

            const parsedRows: StatementParsedRow[] = (data.rows || []).map((r: any, idx: number) => ({
              id: `row-${Date.now()}-${idx}`,
              date: r.date || new Date().toISOString().split('T')[0],
              particulars: r.particulars || r.description || `Invoice #${r.vchNo || idx + 1}`,
              vchType: (r.vchType as any) || (r.debit > 0 ? 'Purchase' : 'Payment'),
              vchNo: r.vchNo || '',
              debit: Number(r.debit) || 0,
              credit: Number(r.credit) || 0,
              balance: Number(r.balance) || 0,
            }));

            if (parsedRows.length > 0) {
              setRows(parsedRows);
              setStatusMessage(`यशस्वी! ${parsedRows.length} व्यवहार आढळले. कृपया खालील तक्त्यामध्ये तपासा.`);
            } else {
              // Populate initial blank row
              setRows([
                {
                  id: `row-${Date.now()}-1`,
                  date: new Date().toISOString().split('T')[0],
                  particulars: 'Goods Purchase',
                  vchType: 'Purchase',
                  debit: 0,
                  credit: 0,
                },
              ]);
              setStatusMessage('व्यवहार सापडले नाहीत. आपण स्वतः माहिती भरू शकता.');
            }
          } else {
            // Graceful fallback row for manual review
            setRows([
              {
                id: `row-${Date.now()}-1`,
                date: new Date().toISOString().split('T')[0],
                particulars: 'सामान खरेदी (Bill)',
                vchType: 'Purchase',
                debit: 0,
                credit: 0,
              },
            ]);
            setStatusMessage('OCR मॉडेल तयार नाही, खालील तक्त्यामध्ये थेट नोंद करा.');
          }
        } catch (fetchErr: any) {
          setErrorBanner('सर्व्हरकडून उत्तर आले नाही. आपण स्वतः माहिती भरून सेव्ह करू शकता.');
          setRows([
            {
              id: `row-${Date.now()}-1`,
              date: new Date().toISOString().split('T')[0],
              particulars: 'सामान खरेदी (Bill)',
              vchType: 'Purchase',
              debit: 0,
              credit: 0,
            },
          ]);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorBanner('फाईल वाचताना अडचण आली.');
    }
  };

  // Row operations
  const handleUpdateRow = (id: string, field: keyof StatementParsedRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === 'debit' && Number(value) > 0) {
          updated.credit = 0;
          updated.vchType = 'Purchase';
        } else if (field === 'credit' && Number(value) > 0) {
          updated.debit = 0;
          updated.vchType = 'Payment';
        }
        return updated;
      })
    );
  };

  const handleAddRow = () => {
    const newRow: StatementParsedRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      particulars: 'सामान खरेदी / पेमेंट',
      vchType: 'Purchase',
      debit: 0,
      credit: 0,
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Calculations
  const totalDebit = rows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
  const totalCredit = rows.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
  const netDifference = totalDebit - totalCredit;

  // Confirm and save to ledger
  const handleConfirmAndSave = () => {
    let finalDealerId = selectedDealerId;
    let finalDealerName = '';

    if (!finalDealerId) {
      const name = newDealerNameInput.trim() || detectedPartyName.trim();
      if (!name) {
        alert('कृपया पार्टी / डीलरचे नाव निवडा किंवा प्रविष्ट करा!');
        return;
      }
      finalDealerName = name;
      finalDealerId = `dlr-${Date.now()}`;
      if (onAddDealer) {
        onAddDealer({
          name: finalDealerName,
          phone: '',
          address: 'Wardha',
          gstin: '',
          totalPurchases: totalDebit,
          totalPaid: totalCredit,
          balanceDue: Math.max(0, totalDebit - totalCredit),
          lastTransactionDate: new Date().toISOString().split('T')[0],
        });
      }
    } else {
      const d = dealers.find((item) => item.id === finalDealerId);
      finalDealerName = d?.name || 'Party';
    }

    if (rows.length === 0) {
      alert('कमीत कमी १ व्यवहार आवश्यक आहे!');
      return;
    }

    onImportStatementEntries(finalDealerId, finalDealerName, rows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4 my-auto max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                <span>पार्टी स्टेटमेंट पार्सर (Party Statement OCR)</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-mono">
                  PDF & PNG
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                डीलर / होलसेलरचे फायनान्शिअल स्टेटमेंट अपलोड करा आणि खातेवहीत थेट सेव्ह करा.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorBanner && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
        )}

        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          {/* File Upload Zone */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-4 sm:p-5 text-center transition bg-slate-50/50 dark:bg-slate-850/50">
            <input
              type="file"
              id="statement-file-input"
              accept=".pdf,image/png,image/jpeg,image/jpg"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="statement-file-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {selectedFile ? selectedFile.name : 'PDF किंवा इमेज (PNG/JPG) स्टेटमेंट निवडा'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tally, Busy, बँक स्टेटमेंट किंवा होलसेलर लेजर शीट थेट अपलोड करा
              </p>
            </label>
          </div>

          {statusMessage && (
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Party Match / Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-100 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                पार्टी / डीलर निवडा (Select Existing Party)
              </label>
              <select
                value={selectedDealerId}
                onChange={(e) => {
                  setSelectedDealerId(e.target.value);
                  if (e.target.value) setNewDealerNameInput('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="">-- यादीतून डीलर निवडा किंवा खाली नवीन नाव लिहा --</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    🏢 {d.name} (बाकी: ₹{(d.balanceDue || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                किंवा नवीन पार्टी नाव (Or Create New Party)
              </label>
              <input
                type="text"
                value={newDealerNameInput}
                onChange={(e) => {
                  setNewDealerNameInput(e.target.value);
                  if (e.target.value) setSelectedDealerId('');
                }}
                placeholder="उदा. Manisha Enterprises, Wardha"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Mandatory Review Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                पार्टी लेजर तपशील पुनरावलोकन (Mandatory Review Table)
              </span>
              <button
                type="button"
                onClick={handleAddRow}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-blue-200 dark:border-blue-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ओळ जोडा (Add Row)</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[110px]">तारीख (Date)</th>
                    <th className="py-2.5 px-3 min-w-[180px]">तपशील (Particulars / Invoice)</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-right">खरेदी (Debit ₹)</th>
                    <th className="py-2.5 px-3 min-w-[100px] text-right">पेमेंट (Credit ₹)</th>
                    <th className="py-2.5 px-2 text-center w-10">हटा</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-1.5 px-2">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => handleUpdateRow(row.id, 'date', e.target.value)}
                          className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs text-slate-800 dark:text-slate-200"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={row.particulars}
                          onChange={(e) => handleUpdateRow(row.id, 'particulars', e.target.value)}
                          placeholder="तपशील लिहा..."
                          className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          value={row.debit || ''}
                          onChange={(e) => handleUpdateRow(row.id, 'debit', Number(e.target.value))}
                          placeholder="0"
                          className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-right text-xs font-bold text-rose-600 dark:text-rose-400"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          value={row.credit || ''}
                          onChange={(e) => handleUpdateRow(row.id, 'credit', Number(e.target.value))}
                          placeholder="0"
                          className="w-full px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-right text-xs font-bold text-emerald-600 dark:text-emerald-400"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        कोणतीही ओळ उपलब्ध नाही. कृपया फाईल अपलोड करा किंवा '+ ओळ जोडा' वर क्लिक करा.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mathematical Balance Validation Bar */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">एकूण खरेदी (Total Debits)</span>
                <span className="font-mono font-bold text-sm text-rose-400">
                  ₹{totalDebit.toLocaleString()}
                </span>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <span className="text-slate-400 block text-[10px]">एकूण जमा (Total Payments)</span>
                <span className="font-mono font-bold text-sm text-emerald-400">
                  ₹{totalCredit.toLocaleString()}
                </span>
              </div>
              <div className="border-l border-slate-700 pl-4">
                <span className="text-slate-400 block text-[10px]">उरलेली देणी बाकी (Net Balance)</span>
                <span className="font-mono font-black text-sm text-amber-300">
                  ₹{Math.abs(netDifference).toLocaleString()} {netDifference >= 0 ? '(बाकी)' : '(अ‍ॅडव्हान्स)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
              >
                रद्द करा
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSave}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>खातेवहीत सेव्ह करा (Confirm & Import)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
