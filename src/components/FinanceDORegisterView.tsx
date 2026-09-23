import React, { useState } from 'react';
import { 
  Calculator, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  FileText, 
  Phone, 
  Filter, 
  ArrowUpRight,
  Download,
  X,
  CreditCard
} from 'lucide-react';
import { FinanceDORecord } from '../types';

interface FinanceDORegisterViewProps {
  records: FinanceDORecord[];
  onSaveRecord: (record: FinanceDORecord) => void;
  onUpdateStatus: (id: string, status: FinanceDORecord['payoutStatus'], utr?: string) => void;
  businessPhone: string;
}

export const FinanceDORegisterView: React.FC<FinanceDORegisterViewProps> = ({
  records = [],
  onSaveRecord,
  onUpdateStatus,
  businessPhone = '8766486915',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit UTR state
  const [editingUtrId, setEditingUtrId] = useState<string | null>(null);
  const [utrInput, setUtrInput] = useState('');

  // New Record Form State
  const [form, setForm] = useState<Partial<FinanceDORecord>>({
    customerName: '',
    customerPhone: '',
    invoiceNo: 'INV-2026-01',
    itemName: '43" 4K Smart Google LED TV',
    financeCompany: 'Bajaj Finserv',
    doNumber: 'DO-BJ-9921',
    sanctionedAmount: 22000,
    customerDownPayment: 4000,
    processingFee: 750,
    dbdAmount: 0,
    insuranceAmount: 0,
    payoutStatus: 'Pending DO Verification',
    notes: '',
  });

  const filteredRecords = records.filter((rec) => {
    if (companyFilter !== 'all' && rec.financeCompany !== companyFilter) return false;
    if (statusFilter !== 'all' && rec.payoutStatus !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = rec.customerName.toLowerCase().includes(q);
      const matchDO = rec.doNumber.toLowerCase().includes(q);
      const matchInv = rec.invoiceNo.toLowerCase().includes(q);
      const matchPhone = rec.customerPhone.includes(q);
      if (!matchName && !matchDO && !matchInv && !matchPhone) return false;
    }
    return true;
  });

  // Calculate Metrics
  const totalFinanced = records.reduce((sum, r) => sum + Number(r.sanctionedAmount || 0), 0);
  const pendingPayout = records
    .filter((r) => r.payoutStatus === 'Pending DO Verification')
    .reduce((sum, r) => sum + Number(r.sanctionedAmount || 0), 0);
  const disbursedTotal = records
    .filter((r) => r.payoutStatus === 'Disbursed to Bank' || r.payoutStatus === 'UTR Received')
    .reduce((sum, r) => sum + Number(r.sanctionedAmount || 0), 0);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.doNumber) {
      alert('कृपया ग्राहकाचे नाव आणि DO नंबर प्रविष्ट करा.');
      return;
    }

    const newRecord: FinanceDORecord = {
      id: `fin-${Date.now()}`,
      customerName: form.customerName || '',
      customerPhone: form.customerPhone || '',
      invoiceNo: form.invoiceNo || 'INV-2026',
      itemName: form.itemName || '',
      financeCompany: (form.financeCompany as any) || 'Bajaj Finserv',
      doNumber: form.doNumber || '',
      sanctionedAmount: Number(form.sanctionedAmount || 0),
      customerDownPayment: Number(form.customerDownPayment || 0),
      processingFee: Number(form.processingFee || 0),
      dbdAmount: Number(form.dbdAmount || 0),
      insuranceAmount: Number(form.insuranceAmount || 0),
      netDisbursalAmount: Math.max(0, Number(form.sanctionedAmount || 0) - Number(form.dbdAmount || 0)),
      payoutStatus: 'Pending DO Verification',
      notes: form.notes || '',
      createdAt: new Date().toISOString(),
    };

    onSaveRecord(newRecord);
    setShowAddModal(false);
    setForm({
      customerName: '',
      customerPhone: '',
      invoiceNo: 'INV-2026-01',
      itemName: '',
      financeCompany: 'Bajaj Finserv',
      doNumber: '',
      sanctionedAmount: 20000,
      customerDownPayment: 4000,
      processingFee: 750,
      dbdAmount: 0,
      insuranceAmount: 0,
      payoutStatus: 'Pending DO Verification',
      notes: '',
    });
  };

  const handleSaveUtr = (id: string) => {
    if (!utrInput.trim()) return;
    onUpdateStatus(id, 'UTR Received', utrInput.trim());
    setEditingUtrId(null);
    setUtrInput('');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-4 sm:p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-blue-200">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
              बजाज, टीव्हीएस व फायनान्स डीओ रजिस्टर (Finance DO & Payouts)
            </h1>
            <p className="text-xs sm:text-sm text-blue-200">
              बजाज फिनसर्व्ह, TVS क्रेडिट, HDB, IDFC कडून मंजुरी (DO) व बँक खात्यात येणारे क्लेम्स
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>नवीन DO नोंद करा (New Finance DO)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">एकूण फायनान्स विक्री</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            ₹{totalFinanced.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">{records.length} फायनान्स केसेस</span>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">कंपनीकडून बाकी पेआउट्स (Pending DO)</span>
          <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-1">
            ₹{pendingPayout.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-amber-600/80 mt-0.5 block">दुकानाच्या बँकेत जमा होणे बाकी</span>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">खात्यात जमा झालेली रक्कम (Disbursed)</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
            ₹{disbursedTotal.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-emerald-600/80 mt-0.5 block">UTR प्राप्त झालेले क्लेम्स</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-[#0F172A] p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ग्राहक नाव, DO नंबर, बिल नंबर शोधा..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-2.5 font-medium cursor-pointer"
          >
            <option value="all">सर्व फायनान्स कंपन्या</option>
            <option value="Bajaj Finserv">Bajaj Finserv</option>
            <option value="TVS Credit">TVS Credit</option>
            <option value="HDB Financial">HDB Financial</option>
            <option value="IDFC First">IDFC First</option>
            <option value="Shriram Finance">Shriram Finance</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-2.5 font-medium cursor-pointer hidden sm:block"
          >
            <option value="all">सर्व स्टेटस</option>
            <option value="Pending DO Verification">Pending DO (तपासणी बाकी)</option>
            <option value="Disbursed to Bank">Disbursed (बँकेत जमा)</option>
            <option value="UTR Received">UTR Received (पूर्ण क्लेम)</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-2xs">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Calculator className="w-10 h-10 text-blue-500 mx-auto mb-2 opacity-60" />
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">कोणतीही फायनान्स नोंद आढळली नाही.</p>
            <p className="text-xs mt-0.5">बजाज किंवा टीव्हीएसच्या नवीन DO साठी "नवीन DO नोंद करा" वापरा.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-3">तपशील व DO नंबर</th>
                <th className="p-3">ग्राहक व वस्तू</th>
                <th className="p-3">फायनान्स कंपनी</th>
                <th className="p-3">मंजूर रक्कम (₹)</th>
                <th className="p-3">डाऊन पेमेंट</th>
                <th className="p-3">स्टेटस व UTR</th>
                <th className="p-3 text-right">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="p-3">
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-400 block">
                      {rec.doNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      बिल: {rec.invoiceNo}
                    </span>
                  </td>

                  <td className="p-3">
                    <strong className="text-slate-900 dark:text-white font-bold block">
                      {rec.customerName}
                    </strong>
                    <span className="text-slate-500 text-[11px]">
                      {rec.itemName || 'इलेक्ट्रॉनिक्स/फर्निचर'} • {rec.customerPhone}
                    </span>
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-semibold text-[11px] border border-blue-200 dark:border-blue-800">
                      {rec.financeCompany}
                    </span>
                  </td>

                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white text-sm">
                    ₹{rec.sanctionedAmount.toLocaleString('en-IN')}
                  </td>

                  <td className="p-3 font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    <div>₹{rec.customerDownPayment.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-slate-400 font-normal space-x-1">
                      {rec.processingFee > 0 && <span>फी: ₹{rec.processingFee}</span>}
                      {rec.insuranceAmount ? <span>• इन्शुरन्स: ₹{rec.insuranceAmount}</span> : null}
                      {rec.dbdAmount ? <span className="text-amber-600 block">• DBD: -₹{rec.dbdAmount}</span> : null}
                    </div>
                  </td>

                  <td className="p-3">
                    {rec.payoutStatus === 'UTR Received' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>UTR: {rec.utrNumber || 'प्राप्त'}</span>
                      </span>
                    ) : rec.payoutStatus === 'Disbursed to Bank' ? (
                      <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>बँकेत जमा (Disbursed)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>DO तपासणी सुरू</span>
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-right">
                    {rec.payoutStatus !== 'UTR Received' && (
                      <div className="inline-flex items-center gap-1">
                        {editingUtrId === rec.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="UTR No."
                              value={utrInput}
                              onChange={(e) => setUtrInput(e.target.value)}
                              className="w-24 p-1 text-xs border rounded-md"
                            />
                            <button
                              onClick={() => handleSaveUtr(rec.id)}
                              className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[10px]"
                            >
                              सेव्ह
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUtrId(rec.id);
                              setUtrInput('');
                            }}
                            className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-[11px] border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer"
                          >
                            + UTR जोडा
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-blue-700 text-white">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                <h3 className="font-bold text-base">नवीन फायनान्स DO नोंद (New Finance DO)</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ग्राहक नाव *</label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="उदा. अमित ठाकरे"
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">मोबाईल नंबर *</label>
                  <input
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder="10 अंकी नंबर"
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">फायनान्स कंपनी</label>
                  <select
                    value={form.financeCompany}
                    onChange={(e) => setForm({ ...form, financeCompany: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Bajaj Finserv">Bajaj Finserv</option>
                    <option value="TVS Credit">TVS Credit</option>
                    <option value="HDB Financial">HDB Financial Services</option>
                    <option value="IDFC First">IDFC First Bank</option>
                    <option value="Shriram Finance">Shriram Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">DO / Agreement Number *</label>
                  <input
                    type="text"
                    required
                    value={form.doNumber}
                    onChange={(e) => setForm({ ...form, doNumber: e.target.value })}
                    placeholder="उदा. DO-88219"
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">बिल नंबर</label>
                  <input
                    type="text"
                    value={form.invoiceNo}
                    onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">वस्तूचे नाव</label>
                  <input
                    type="text"
                    value={form.itemName}
                    onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                    placeholder="उदा. 43 इंच स्मार्ट टीव्ही / 190L फ्रिज"
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">मंजूर लोन / DO रक्कम (₹)</label>
                  <input
                    type="number"
                    value={form.sanctionedAmount}
                    onChange={(e) => setForm({ ...form, sanctionedAmount: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ग्राहकाने दिलेले डाऊन पेमेंट (₹)</label>
                  <input
                    type="number"
                    value={form.customerDownPayment}
                    onChange={(e) => setForm({ ...form, customerDownPayment: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Bajaj & Finance Special Charges: Processing Fee, Insurance & DBD */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-2.5">
                <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider block">
                  फायनान्स चार्जेस व सवलत (बजाज / टीव्हीएस)
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      प्रोसेसिंग फी (₹)
                    </label>
                    <input
                      type="number"
                      value={form.processingFee}
                      onChange={(e) => setForm({ ...form, processingFee: Number(e.target.value) })}
                      placeholder="750"
                      className="w-full p-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      इन्शुरन्स (₹)
                    </label>
                    <input
                      type="number"
                      value={form.insuranceAmount || ''}
                      onChange={(e) => setForm({ ...form, insuranceAmount: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full p-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      DBD वजावट (₹)
                    </label>
                    <input
                      type="number"
                      value={form.dbdAmount || ''}
                      onChange={(e) => setForm({ ...form, dbdAmount: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full p-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-blue-200/60 dark:border-blue-800/40">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">बँकेत येणारे अंदाजित डिस्बर्समेंट:</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    ₹{Math.max(0, Number(form.sanctionedAmount || 0) - Number(form.dbdAmount || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  DO नोंद सेव्ह करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
