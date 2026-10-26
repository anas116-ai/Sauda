import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  type Customer, 
  type Supplier, 
  type SupplierLedgerEntryType,
  type PaymentMethod 
} from '../../types';
import { 
  BookOpen, 
  Search, 
  UserPlus, 
  Phone, 
  MapPin, 
  Share2, 
  PlusCircle, 
  MinusCircle, 
  X, 
  Calendar,
  Truck,
  Users,
  FileText,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Clock,
  AlertTriangle,
  Coins,
  Trash2,
  Edit3,
  Check
} from 'lucide-react';
import { 
  calculateCustomerAging, 
  getCreditUtilization, 
  PRESET_CREDIT_LIMITS, 
  type AgingCategory
} from '../../utils/agingUtils';
import { 
  calculateCustomerInterest, 
  INTEREST_RATE_PRESETS, 
  GRACE_PERIOD_PRESETS
} from '../../utils/interestUtils';
import { WhatsAppReminderModal } from './WhatsAppReminderModal';
import { BulkSettlementModal } from './BulkSettlementModal';
import { v4 as uuidv4 } from 'uuid';

export const KhataScreen: React.FC = () => {
  const { formatPaise, currentShop, t } = useApp();
  
  // Segment tab state: 'CUSTOMERS' vs 'SUPPLIERS'
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');

  // Customer states
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showCustomerTxModal, setShowCustomerTxModal] = useState<'DEBIT' | 'CREDIT' | null>(null);
  const [customerAmountInput, setCustomerAmountInput] = useState('');
  const [customerNotesInput, setCustomerNotesInput] = useState('');

  // Milestone 4.1: Aging Filter and Credit Limit Edit States
  const [agingFilter, setAgingFilter] = useState<AgingCategory>('ALL');
  const [showEditCreditLimitModal, setShowEditCreditLimitModal] = useState(false);
  const [editCreditLimitInput, setEditCreditLimitInput] = useState('');

  // Milestone 4.2: WhatsApp Payment Link & Statement Dispatcher State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Milestone 4.3: Simple Interest Configuration State
  const [interestRate, setInterestRate] = useState<number>(18);
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(30);
  const [isInterestActive, setIsInterestActive] = useState<boolean>(false);

  // Milestone 4.4: Multi-Customer Bulk Settlement Modal State
  const [showBulkSettlementModal, setShowBulkSettlementModal] = useState<boolean>(false);

  // Add customer form states
  const [newCustFullName, setNewCustFullName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustVillageCity, setNewCustVillageCity] = useState('');
  const [newCustType, setNewCustType] = useState<'RETAIL' | 'BUSINESS'>('RETAIL');

  // Mistake Rectification: Customer & Entry Edit States
  const [editingEntry, setEditingEntry] = useState<{ id: string; amountPaise: number; notes: string; type: 'CUSTOMER' | 'SUPPLIER' } | null>(null);
  const [editEntryAmountInput, setEditEntryAmountInput] = useState('');
  const [editEntryNotesInput, setEditEntryNotesInput] = useState('');

  const [editingCustomerProfile, setEditingCustomerProfile] = useState<Customer | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustVillage, setEditCustVillage] = useState('');
  const [editCustLimit, setEditCustLimit] = useState('');

  // Supplier states (Phase 2 Milestone 2.2)
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showSupplierTxModal, setShowSupplierTxModal] = useState<'INWARD' | 'PAYMENT' | null>(null);

  // Supplier transaction form states
  const [supplierAmountInput, setSupplierAmountInput] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [supplierPaymentMethod, setSupplierPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [supplierNotesInput, setSupplierNotesInput] = useState('');

  // Add supplier form states
  const [agencyName, setAgencyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierCity, setSupplierCity] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [creditPeriodDays, setCreditPeriodDays] = useState(15);
  const [categoriesInput, setCategoriesInput] = useState('');

  // Live queries from Dexie IndexedDB
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const customerLedger = useLiveQuery(() => db.customerLedger.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const supplierLedger = useLiveQuery(() => db.supplierLedger.toArray()) || [];

  // Auto-select first supplier or customer if none selected
  React.useEffect(() => {
    if (suppliers.length > 0 && !selectedSupplier) {
      setSelectedSupplier(suppliers[0]);
    }
  }, [suppliers, selectedSupplier]);

  React.useEffect(() => {
    if (customers.length > 0 && !selectedCustomer) {
      setSelectedCustomer(customers[0]);
    }
  }, [customers, selectedCustomer]);

  // ==========================================
  // CUSTOMER LEDGER CALCULATIONS
  // ==========================================
  const getCustomerBalancePaise = (customerId: string) => {
    const entries = customerLedger.filter((l) => l.customerId === customerId);
    let balance = 0;
    for (const e of entries) {
      if (e.entryType === 'DEBIT_SALE') {
        balance += e.amountPaise;
      } else if (e.entryType === 'CREDIT_PAYMENT') {
        balance -= e.amountPaise;
      }
    }
    return balance;
  };

  const totalCustomerReceivablesPaise = customers.reduce(
    (sum, c) => sum + Math.max(0, getCustomerBalancePaise(c.id)), 
    0
  );

  // Milestone 4.1: Aging & Credit Limit Counts
  const agingCounts = React.useMemo(() => {
    let current30 = 0;
    let overdue31_60 = 0;
    let overdue60Plus = 0;
    let overLimit = 0;

    for (const c of customers) {
      const balance = getCustomerBalancePaise(c.id);
      const aging = calculateCustomerAging(c.id, customerLedger);
      const limit = c.creditLimitPaise || 500000;

      if (balance > limit) {
        overLimit++;
      }
      if (aging.overdue60PlusPaise > 0) {
        overdue60Plus++;
      } else if (aging.overdue31To60Paise > 0) {
        overdue31_60++;
      } else if (aging.current0To30Paise > 0) {
        current30++;
      }
    }

    return {
      all: customers.length,
      current30,
      overdue31_60,
      overdue60Plus,
      overLimit,
    };
  }, [customers, customerLedger]);

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase();
    const matchesSearch = (
      c.fullName.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      c.customerCode.toLowerCase().includes(q) ||
      (c.villageCity && c.villageCity.toLowerCase().includes(q))
    );
    if (!matchesSearch) return false;

    if (agingFilter === 'ALL') return true;

    const balance = getCustomerBalancePaise(c.id);
    const aging = calculateCustomerAging(c.id, customerLedger);
    const limit = c.creditLimitPaise || 500000;

    if (agingFilter === 'OVER_LIMIT') {
      return balance > limit;
    }
    if (agingFilter === 'CURRENT_30') {
      return aging.current0To30Paise > 0 && aging.overdue31To60Paise === 0 && aging.overdue60PlusPaise === 0;
    }
    if (agingFilter === 'OVERDUE_31_60') {
      return aging.overdue31To60Paise > 0 && aging.overdue60PlusPaise === 0;
    }
    if (agingFilter === 'OVERDUE_60_PLUS') {
      return aging.overdue60PlusPaise > 0;
    }
    return true;
  });

  const currentCustomerEntries = selectedCustomer
    ? customerLedger
        .filter((l) => l.customerId === selectedCustomer.id)
        .sort((a, b) => b.timestamp - a.timestamp)
    : [];

  const currentCustBalancePaise = selectedCustomer ? getCustomerBalancePaise(selectedCustomer.id) : 0;
  const currentCustAging = selectedCustomer ? calculateCustomerAging(selectedCustomer.id, customerLedger) : null;
  const currentCustUtil = selectedCustomer ? getCreditUtilization(currentCustBalancePaise, selectedCustomer.creditLimitPaise || 500000) : null;

  const handleOpenCreditLimitModal = () => {
    if (!selectedCustomer) return;
    setEditCreditLimitInput(((selectedCustomer.creditLimitPaise || 500000) / 100).toString());
    setShowEditCreditLimitModal(true);
  };

  const handleUpdateCreditLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const limitPaise = Math.round(Number(editCreditLimitInput) * 100);
    if (isNaN(limitPaise) || limitPaise < 0) return;

    await db.customers.update(selectedCustomer.id, {
      creditLimitPaise: limitPaise,
    });
    setSelectedCustomer({
      ...selectedCustomer,
      creditLimitPaise: limitPaise,
    });
    setShowEditCreditLimitModal(false);
  };

  // Milestone 4.3: Sync customer interest preferences
  React.useEffect(() => {
    if (selectedCustomer) {
      setInterestRate(selectedCustomer.annualInterestRatePercent || 18);
      setGracePeriodDays(selectedCustomer.gracePeriodDays ?? 30);
      setIsInterestActive(selectedCustomer.interestEnabled ?? false);
    }
  }, [selectedCustomer?.id]);

  const customerInterest = selectedCustomer
    ? calculateCustomerInterest(
        selectedCustomer.id,
        customerLedger,
        interestRate,
        gracePeriodDays
      )
    : null;

  const handlePostInterestToLedger = async () => {
    if (!selectedCustomer || !customerInterest || customerInterest.accruedInterestPaise <= 0) return;
    
    const formattedAmt = formatPaise(customerInterest.accruedInterestPaise);
    if (!window.confirm(
      t(
        `ఈ కస్టమర్ ఖాతాలో ${formattedAmt} వడ్డీని ఉధార్‌గా జతచేయాలా?`,
        `Post accrued interest of ${formattedAmt} to customer ledger?`
      )
    )) {
      return;
    }

    const newEntry = {
      id: uuidv4(),
      customerId: selectedCustomer.id,
      entryType: 'DEBIT_SALE' as const,
      amountPaise: customerInterest.accruedInterestPaise,
      notes: `వడ్డీ సర్దుబాటు / Interest Accrued (${interestRate}% p.a. • ${customerInterest.chargeableDays} days)`,
      timestamp: Date.now(),
    };

    await db.customerLedger.add(newEntry);
    alert(t('వడ్డీ విజయవంతంగా ఖాతాలో నమోదు చేయబడింది!', 'Interest successfully posted to customer ledger!'));
  };

  const handleUpdateCustomerInterestSettings = async (rate: number, grace: number, enabled: boolean) => {
    if (!selectedCustomer) return;
    setInterestRate(rate);
    setGracePeriodDays(grace);
    setIsInterestActive(enabled);

    await db.customers.update(selectedCustomer.id, {
      annualInterestRatePercent: rate,
      gracePeriodDays: grace,
      interestEnabled: enabled,
    });
    setSelectedCustomer({
      ...selectedCustomer,
      annualInterestRatePercent: rate,
      gracePeriodDays: grace,
      interestEnabled: enabled,
    });
  };

  // ==========================================
  // SUPPLIER LEDGER CALCULATIONS (Phase 2)
  // ==========================================
  const getSupplierBalancePaise = (supplierId: string) => {
    const entries = supplierLedger.filter((l) => l.supplierId === supplierId);
    let balance = 0;
    for (const e of entries) {
      if (e.entryType === 'PURCHASE_CREDIT') {
        balance += e.amountPaise; // We owe them money
      } else if (e.entryType === 'PAYMENT_DEBIT' || e.entryType === 'RETURN_DEBIT') {
        balance -= e.amountPaise; // We paid or returned
      }
    }
    return balance;
  };

  const totalSupplierPayablesPaise = suppliers.reduce(
    (sum, s) => sum + Math.max(0, getSupplierBalancePaise(s.id)),
    0
  );

  const filteredSuppliers = suppliers.filter((s) => {
    const q = supplierSearch.toLowerCase();
    return (
      s.agencyName.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.supplierCode.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      (s.gstin && s.gstin.toLowerCase().includes(q)) ||
      (s.categoriesSupplied && s.categoriesSupplied.some(cat => cat.toLowerCase().includes(q)))
    );
  });

  const currentSupplierEntries = selectedSupplier
    ? supplierLedger
        .filter((l) => l.supplierId === selectedSupplier.id)
        .sort((a, b) => b.timestamp - a.timestamp)
    : [];

  const currentSupplierBalancePaise = selectedSupplier ? getSupplierBalancePaise(selectedSupplier.id) : 0;

  // ==========================================
  // HANDLERS: CUSTOMERS
  // ==========================================
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustFullName.trim()) return;

    const codeNum = customers.length + 1;
    const customerCode = `CUS-${codeNum.toString().padStart(6, '0')}`;

    const newCust: Customer = {
      id: uuidv4(),
      shopId: currentShop?.id || 'shop-001',
      customerCode,
      fullName: newCustFullName.trim(),
      phone: newCustPhone.trim() || undefined,
      villageCity: newCustVillageCity.trim() || undefined,
      customerType: newCustType,
      creditLimitPaise: 500000,
      createdAt: Date.now(),
    };

    await db.customers.add(newCust);
    setSelectedCustomer(newCust);
    setShowAddCustomerModal(false);
    setNewCustFullName('');
    setNewCustPhone('');
    setNewCustVillageCity('');
  };

  const handleAddCustomerTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !customerAmountInput || Number(customerAmountInput) <= 0) return;

    const amountPaise = Math.round(Number(customerAmountInput) * 100);
    const entryType = showCustomerTxModal === 'DEBIT' ? 'DEBIT_SALE' : 'CREDIT_PAYMENT';

    await db.customerLedger.add({
      id: uuidv4(),
      customerId: selectedCustomer.id,
      entryType,
      amountPaise,
      paymentMethod: entryType === 'CREDIT_PAYMENT' ? 'CASH' : undefined,
      notes: customerNotesInput.trim() || (entryType === 'DEBIT_SALE' ? 'ఉధార్ సామాన్లు' : 'నగదు జమా'),
      timestamp: Date.now(),
    });

    setShowCustomerTxModal(null);
    setCustomerAmountInput('');
    setCustomerNotesInput('');
  };

  // ---------------------------------------------------------------------------
  // Mistake Rectification / CRUD: Ledger Entry Delete Handlers
  // ---------------------------------------------------------------------------
  const handleDeleteCustomerEntry = async (entryId: string) => {
    if (window.confirm(t('ఈ ఖాతా ఎంట్రీని రద్దు చేయాలా? కస్టమర్ బాకీ ఆటోమేటిక్‌గా రీకాలిక్యులేట్ అవుతుంది.', 'Are you sure you want to delete this customer ledger entry? The customer balance will recalculate automatically.'))) {
      await db.customerLedger.delete(entryId);
    }
  };

  const handleDeleteSupplierEntry = async (entryId: string) => {
    if (window.confirm(t('ఈ సప్లయర్ ఎంట్రీని రద్దు చేయాలా? సప్లయర్ బాకీ ఆటోమేటిక్‌గా రీకాలిక్యులేట్ అవుతుంది.', 'Are you sure you want to delete this supplier ledger entry? The supplier balance will recalculate automatically.'))) {
      await db.supplierLedger.delete(entryId);
    }
  };

  const handleOpenEditEntry = (id: string, amountPaise: number, notes: string, type: 'CUSTOMER' | 'SUPPLIER') => {
    setEditingEntry({ id, amountPaise, notes, type });
    setEditEntryAmountInput((amountPaise / 100).toString());
    setEditEntryNotesInput(notes || '');
  };

  const handleSaveEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    const amountPaise = Math.round(Number(editEntryAmountInput) * 100);
    if (isNaN(amountPaise) || amountPaise <= 0) return;

    if (editingEntry.type === 'CUSTOMER') {
      await db.customerLedger.update(editingEntry.id, {
        amountPaise,
        notes: editEntryNotesInput.trim()
      });
    } else {
      await db.supplierLedger.update(editingEntry.id, {
        amountPaise,
        notes: editEntryNotesInput.trim()
      });
    }
    setEditingEntry(null);
  };

  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomerProfile(c);
    setEditCustName(c.fullName);
    setEditCustPhone(c.phone || '');
    setEditCustVillage(c.villageCity || '');
    setEditCustLimit(((c.creditLimitPaise || 500000) / 100).toString());
  };

  const handleSaveCustomerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomerProfile) return;
    const limitPaise = Math.round(Number(editCustLimit) * 100);

    await db.customers.update(editingCustomerProfile.id, {
      fullName: editCustName.trim(),
      phone: editCustPhone.trim(),
      villageCity: editCustVillage.trim() || undefined,
      creditLimitPaise: isNaN(limitPaise) ? editingCustomerProfile.creditLimitPaise : limitPaise
    });

    if (selectedCustomer?.id === editingCustomerProfile.id) {
      setSelectedCustomer({
        ...selectedCustomer,
        fullName: editCustName.trim(),
        phone: editCustPhone.trim(),
        villageCity: editCustVillage.trim() || undefined,
        creditLimitPaise: isNaN(limitPaise) ? editingCustomerProfile.creditLimitPaise : limitPaise
      });
    }
    setEditingCustomerProfile(null);
  };

  // ==========================================
  // HANDLERS: SUPPLIERS (Phase 2 Milestone 2.2)
  // ==========================================
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim() || !contactPerson.trim() || !supplierPhone.trim()) return;

    const codeNum = suppliers.length + 1;
    const supplierCode = `SUP-${codeNum.toString().padStart(3, '0')}`;

    const categories = categoriesInput
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    const newSupplier: Supplier = {
      id: uuidv4(),
      shopId: currentShop?.id || 'shop-001',
      supplierCode,
      agencyName: agencyName.trim(),
      contactPerson: contactPerson.trim(),
      phone: supplierPhone.trim(),
      email: supplierEmail.trim() || undefined,
      address: supplierAddress.trim() || undefined,
      cityVillage: supplierCity.trim() || undefined,
      gstin: supplierGstin.trim().toUpperCase() || undefined,
      creditPeriodDays: Number(creditPeriodDays) || 15,
      categoriesSupplied: categories.length > 0 ? categories : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.suppliers.add(newSupplier);
    setSelectedSupplier(newSupplier);
    setShowAddSupplierModal(false);

    // Reset form
    setAgencyName('');
    setContactPerson('');
    setSupplierPhone('');
    setSupplierEmail('');
    setSupplierAddress('');
    setSupplierCity('');
    setSupplierGstin('');
    setCategoriesInput('');
  };

  const handleAddSupplierTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !supplierAmountInput || Number(supplierAmountInput) <= 0) return;

    const amountPaise = Math.round(Number(supplierAmountInput) * 100);
    const entryType: SupplierLedgerEntryType = 
      showSupplierTxModal === 'INWARD' ? 'PURCHASE_CREDIT' : 'PAYMENT_DEBIT';

    await db.supplierLedger.add({
      id: uuidv4(),
      supplierId: selectedSupplier.id,
      entryType,
      amountPaise,
      paymentMethod: entryType === 'PAYMENT_DEBIT' ? supplierPaymentMethod : undefined,
      referenceInvoiceNumber: supplierInvoiceNo.trim() || undefined,
      notes: supplierNotesInput.trim() || (entryType === 'PURCHASE_CREDIT' ? 'సరుకు కొనుగోలు (Inward Bill)' : 'చెల్లింపు (Payment Made)'),
      timestamp: Date.now(),
    });

    setShowSupplierTxModal(null);
    setSupplierAmountInput('');
    setSupplierInvoiceNo('');
    setSupplierNotesInput('');
  };

  const getSupplierWhatsAppStatementUrl = () => {
    if (!selectedSupplier) return '';
    const text = encodeURIComponent(
      `నమస్కారం ${selectedSupplier.contactPerson} (${selectedSupplier.agencyName}),\n` +
      `*${currentShop?.name || 'Sri Lakshmi General Store'}* నుండి సప్లయర్ ఖాతా సారాంశం:\n` +
      `• మీ వద్ద మేము కొనుగోలు చేసిన సరుకు ప్రస్తుత బాకీ: *${formatPaise(currentSupplierBalancePaise)}*.\n` +
      `• GSTIN: ${selectedSupplier.gstin || 'N/A'}\n` +
      `• Credit Terms: ${selectedSupplier.creditPeriodDays} Days.\nధన్యవాదాలు!`
    );
    return `https://wa.me/${selectedSupplier.phone ? `91${selectedSupplier.phone}` : ''}?text=${text}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      
      {/* TOP HEADER & SEGMENTED SWITCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 apple-glass-card p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slateBase-900 flex items-center">
            <div className="p-2.5 rounded-2xl bg-saudaBlue-500/10 text-saudaBlue-600 mr-3 border border-saudaBlue-500/20 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>{t('ఖాతా పుస్తకం & సప్లయర్ల లెడ్జర్', 'Khata Book & Supplier Ledger')}</span>
          </h1>
          <p className="text-xs text-slateBase-500 font-medium mt-1.5">
            {t(
              'కస్టమర్ల ఉధార్ మరియు ఎఫ్‌ఎమ్‌సిజి డిస్ట్రిబ్యూటర్ల బాకీలను ఒకే చోట సులభంగా నిర్వహించండి',
              'Effortlessly manage customer credit receivables and FMCG distributor supply payables in one unified ledger'
            )}
          </p>
        </div>

        {/* Tactile Segment Switch */}
        <div className="inline-flex p-1 bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 shadow-inner">
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'SUPPLIERS'
                ? 'bg-white text-saudaBlue-700 shadow-sm border border-slateBase-200/80 font-bold'
                : 'text-slateBase-600 hover:text-slateBase-900'
            }`}
          >
            <Truck className="w-4 h-4 text-saudaBlue-600" />
            <span>{t('సప్లయర్స్ & ఏజెన్సీలు', 'Suppliers & Distributors')}</span>
            <span className="bg-saudaBlue-100 text-saudaBlue-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {suppliers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'CUSTOMERS'
                ? 'bg-white text-saudaBlue-700 shadow-sm border border-slateBase-200/80 font-bold'
                : 'text-slateBase-600 hover:text-slateBase-900'
            }`}
          >
            <Users className="w-4 h-4 text-saudaBlue-600" />
            <span>{t('కస్టమర్ల ఖాతా', 'Customer Khata')}</span>
            <span className="bg-slateBase-200 text-slateBase-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {customers.length}
            </span>
          </button>
        </div>
      </div>

      {/* SUMMARY METRIC STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <div className="apple-glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slateBase-400 uppercase tracking-wider">
              {t('సప్లయర్ల మొత్తం బాకీ (మనం చెల్లించవలసినది)', 'Total Payables to Distributors')}
            </div>
            <div className="text-2xl font-bold tracking-tight text-classicCrimson-600 mt-1.5 tnum">
              {formatPaise(totalSupplierPayablesPaise)}
            </div>
            <div className="text-[10px] text-slateBase-400 mt-0.5 font-medium">
              {suppliers.length} {t('డిస్ట్రిబ్యూటర్లకు బ్యాలెన్స్', 'active distributors pending')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-classicCrimson-50 border border-classicCrimson-100 flex items-center justify-center text-classicCrimson-600">
            <Truck className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="apple-glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slateBase-400 uppercase tracking-wider">
              {t('కస్టమర్ల ఉధార్ (మనకు రావలసినది)', 'Customer Receivables (Udhar)')}
            </div>
            <div className="text-2xl font-bold tracking-tight text-classicEmerald-600 mt-1.5 tnum font-mono">
              {formatPaise(totalCustomerReceivablesPaise)}
            </div>
            <div className="text-[10px] text-slateBase-400 mt-0.5 font-medium">
              {customers.length} {t('ఖాతాదారుల బ్యాలెన్స్', 'registered customer accounts')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-classicEmerald-500/10 border border-classicEmerald-500/20 flex items-center justify-center text-classicEmerald-600 shadow-sm">
            <Users className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="apple-glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slateBase-400 uppercase tracking-wider">
              {t('నెట్ వర్కింగ్ క్యాపిటల్ స్థితి', 'Net Working Capital Position')}
            </div>
            <div className="text-2xl font-bold tracking-tight text-slateBase-900 mt-1.5 tnum font-mono">
              {formatPaise(totalCustomerReceivablesPaise - totalSupplierPayablesPaise)}
            </div>
            <div className="text-[10px] text-slateBase-400 mt-0.5 font-medium">
              {t('రావలసినవి మైనస్ చెల్లించవలసినవి', 'Receivables minus Payables')}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-saudaBlue-500/10 border border-saudaBlue-500/20 flex items-center justify-center text-saudaBlue-600 shadow-sm">
            <CreditCard className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SUPPLIERS & DISTRIBUTORS DIRECTORY (Phase 2 Milestone 2.2)          */}
      {/* ========================================================================= */}
      {activeTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN: Suppliers List (5 Cols) */}
          <div className="lg:col-span-5 apple-glass-card flex flex-col h-[660px] overflow-hidden">
            
            <div className="p-4 border-b border-white/60 bg-white/40 backdrop-blur-md flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slateBase-900 flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-saudaBlue-600" />
                  <span>{t('సప్లయర్స్ & ఏజెన్సీలు', 'Suppliers Directory')}</span>
                </h2>
                <p className="text-[11px] text-slateBase-500 mt-0.5 font-medium">
                  {t('నమోదైన ఏజెన్సీలు:', 'Registered Distributors:')} <strong className="text-slateBase-900 font-mono">{suppliers.length}</strong>
                </p>
              </div>

              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>{t('+ కొత్త సప్లయర్', '+ New Supplier')}</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="p-3 border-b border-slateBase-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slateBase-400" />
                <input
                  type="text"
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  placeholder={t('ఏజెన్సీ పేరు, వ్యక్తి, ఫోన్ లేదా బ్రాండ్ వెతకండి...', 'Search agency, contact, phone or brand...')}
                  className="w-full pl-9 pr-3 py-2.5 bg-slateBase-50 border border-slateBase-200 rounded-xl text-xs font-semibold text-slateBase-900 placeholder-slateBase-400 focus:outline-none focus:border-saudaBlue-600 transition"
                />
              </div>
            </div>

            {/* Suppliers Scroll List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slateBase-100">
              {filteredSuppliers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slateBase-400 font-medium">
                  {t('సప్లయర్స్ ఎవరూ కనుగొనబడలేదు', 'No suppliers found matching query')}
                </div>
              ) : (
                filteredSuppliers.map((s) => {
                  const balance = getSupplierBalancePaise(s.id);
                  const isSelected = selectedSupplier?.id === s.id;

                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSupplier(s)}
                      className={`w-full p-4 text-left flex items-start justify-between transition ${
                        isSelected 
                          ? 'bg-saudaBlue-50 border-l-4 border-saudaBlue-600 shadow-inner' 
                          : 'hover:bg-slateBase-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="font-bold text-sm text-slateBase-900 truncate flex items-center">
                          <span>{s.agencyName}</span>
                        </div>
                        <div className="text-[11px] text-slateBase-500 flex items-center flex-wrap gap-x-2 gap-y-1 mt-1 font-medium">
                          <span className="font-mono text-slateBase-700 bg-slateBase-100 px-1.5 py-0.5 rounded text-[10px]">
                            {s.supplierCode}
                          </span>
                          <span>{s.contactPerson}</span>
                          <span>• {s.phone}</span>
                        </div>
                        {s.categoriesSupplied && (
                          <div className="flex items-center flex-wrap gap-1 mt-1.5">
                            {s.categoriesSupplied.slice(0, 3).map((cat, i) => (
                              <span key={i} className="text-[9px] font-semibold bg-white border border-slateBase-200 text-slateBase-600 px-1.5 py-0.2 rounded-md">
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div
                          className={`font-black text-sm tnum ${
                            balance > 0 ? 'text-classicCrimson-600' : 'text-classicEmerald-700'
                          }`}
                        >
                          {formatPaise(balance)}
                        </div>
                        <div className="text-[10px] text-slateBase-400 font-bold uppercase tracking-wider mt-0.5">
                          {balance > 0 ? t('మనం ఇవ్వాలి', 'Payable Due') : t('సరిపోయింది', 'Settled')}
                        </div>
                        <div className="text-[10px] font-medium text-slateBase-500 mt-1">
                          {s.creditPeriodDays} {t('రోజుల గడువు', 'days term')}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Supplier Profile & Ledger Timeline (7 Cols) */}
          <div className="lg:col-span-7 apple-glass-card flex flex-col h-[660px] overflow-hidden">
            {selectedSupplier ? (
              <>
                {/* Supplier Profile Banner */}
                <div className="p-5 border-b border-white/60 bg-white/40 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-slateBase-900">{selectedSupplier.agencyName}</h3>
                      <span className="text-[10px] font-bold bg-white text-slateBase-700 px-2 py-0.5 rounded-full font-mono border border-slateBase-300">
                        {selectedSupplier.supplierCode}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slateBase-600 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 font-medium">
                      <span className="font-semibold text-slateBase-800">{selectedSupplier.contactPerson}</span>
                      <span className="flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1 text-slateBase-400" />
                        {selectedSupplier.phone}
                      </span>
                      {selectedSupplier.cityVillage && (
                        <span className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slateBase-400" />
                          {selectedSupplier.cityVillage}
                        </span>
                      )}
                      {selectedSupplier.gstin && (
                        <span className="bg-saudaBlue-50 text-saudaBlue-700 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-saudaBlue-200">
                          GST: {selectedSupplier.gstin}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Highlighted Balance Card */}
                  <div className="p-3.5 rounded-xl bg-white border border-classicCrimson-200 text-right shadow-card">
                    <div className="text-[10px] font-bold text-slateBase-500 uppercase tracking-wider">
                      {t('మనం చెల్లించవలసిన బాకీ', 'Current Payable Balance')}
                    </div>
                    <div className="text-2xl font-syne font-black text-classicCrimson-600 tnum mt-0.5">
                      {formatPaise(currentSupplierBalancePaise)}
                    </div>
                    <div className="text-[10px] text-slateBase-500 font-medium mt-0.5">
                      {selectedSupplier.creditPeriodDays} {t('రోజుల క్రెడిట్ పీరియడ్', 'days payment term')}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Inward Stock, Record Payment, WhatsApp */}
                <div className="p-3 border-b border-slateBase-200 grid grid-cols-3 gap-2.5 bg-white">
                  <button
                    onClick={() => setShowSupplierTxModal('INWARD')}
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center transition shadow-2xs active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5 text-blue-200" />
                    {t('+ సరుకు కొనుగోలు (Inward)', '+ Stock Inward Bill')}
                  </button>

                  <button
                    onClick={() => setShowSupplierTxModal('PAYMENT')}
                    className="py-2.5 px-3 bg-classicEmerald-600 hover:bg-classicEmerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center transition shadow-sm active:scale-95"
                  >
                    <MinusCircle className="w-4 h-4 mr-1.5" />
                    {t('- చెల్లింపు (Record Payment)', '- Record Payment')}
                  </button>

                  <a
                    href={getSupplierWhatsAppStatementUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 bg-white hover:bg-classicEmerald-50 text-classicEmerald-700 border border-classicEmerald-300 rounded-[10px] font-bold text-xs flex items-center justify-center transition active:scale-95"
                  >
                    <Share2 className="w-4 h-4 mr-1.5 text-classicEmerald-600" />
                    {t('స్టేట్‌మెంట్ పంపండి', 'WhatsApp Statement')}
                  </a>
                </div>

                {/* Supplier Ledger Timeline */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {currentSupplierEntries.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-xs text-slateBase-400 font-medium">
                      <FileText className="w-8 h-8 text-slateBase-300 mb-2 stroke-[1.5]" />
                      <span>{t('ఈ సప్లయర్ కి ఎటువంటి లావాదేవీలు లేవు', 'No transactions recorded yet for this supplier')}</span>
                    </div>
                  ) : (
                    currentSupplierEntries.map((e) => {
                      const isInward = e.entryType === 'PURCHASE_CREDIT';
                      return (
                        <div
                          key={e.id}
                          className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                            isInward 
                              ? 'bg-slateBase-50/70 border-slateBase-200' 
                              : 'bg-classicEmerald-50/50 border-classicEmerald-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                isInward 
                                  ? 'bg-slateBase-200 text-slateBase-800' 
                                  : 'bg-classicEmerald-600 text-white'
                              }`}
                            >
                              {isInward ? (
                                <ArrowDownLeft className="w-4 h-4 stroke-[2.2]" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                              )}
                            </div>

                            <div>
                              <div className="font-bold text-xs text-slateBase-900 flex items-center space-x-2">
                                <span>
                                  {isInward 
                                    ? t('సరుకు కొనుగోలు (Stock Inward)', 'Stock Inward Bill') 
                                    : t('డిస్ట్రిబ్యూటర్ కి చెల్లింపు', 'Payment to Distributor')}
                                </span>
                                {e.referenceInvoiceNumber && (
                                  <span className="text-[10px] bg-white border border-slateBase-300 text-slateBase-700 px-1.5 py-0.2 rounded font-mono font-semibold">
                                    {e.referenceInvoiceNumber}
                                  </span>
                                )}
                                {e.paymentMethod && (
                                  <span className="text-[10px] bg-saudaBlue-100 text-saudaBlue-800 px-1.5 py-0.2 rounded font-mono font-bold">
                                    {e.paymentMethod}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slateBase-500 mt-0.5">
                                {e.notes}
                              </div>
                              <div className="text-[10px] text-slateBase-400 flex items-center space-x-1 mt-1 font-medium">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(e.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <div
                                className={`font-syne font-black text-sm tnum ${
                                  isInward ? 'text-classicCrimson-600' : 'text-classicEmerald-700'
                                }`}
                              >
                                {isInward ? '+' : '-'} {formatPaise(e.amountPaise)}
                              </div>
                              <div className="text-[10px] text-slateBase-400 font-bold uppercase tracking-wider">
                                {isInward ? t('బాకీ పెరిగింది', 'Payable Added') : t('చెల్లించబడింది', 'Paid')}
                              </div>
                            </div>
                            <button
                              data-testid={`edit-supplier-entry-${e.id}`}
                              onClick={() => handleOpenEditEntry(e.id, e.amountPaise, e.notes || '', 'SUPPLIER')}
                              className="p-1.5 text-slateBase-400 hover:text-saudaBlue-600 hover:bg-saudaBlue-50 rounded-lg transition"
                              title={t('ఎంట్రీ సవరించు', 'Edit Entry')}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              data-testid={`delete-supplier-entry-${e.id}`}
                              onClick={() => handleDeleteSupplierEntry(e.id)}
                              className="p-1.5 text-slateBase-400 hover:text-classicCrimson-600 hover:bg-classicCrimson-50 rounded-lg transition"
                              title={t('ఎంట్రీ రద్దు చేయండి', 'Void / Delete Entry')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slateBase-400">
                <Truck className="w-12 h-12 stroke-[1.2] text-slateBase-300 mb-2" />
                <p className="text-sm font-semibold text-slateBase-600">
                  {t('సప్లయర్ ని ఎంచుకోండి', 'Select a supplier from directory')}
                </p>
                <p className="text-xs text-slateBase-400 mt-1 max-w-sm">
                  {t(
                    'ఎడమవైపు లిస్ట్ నుండి ఏదైనా డిస్ట్రిబ్యూటర్‌ను ఎంచుకుని వారి సరుకు కొనుగోలు వివరాలు మరియు చెల్లింపుల లెడ్జర్ చూడవచ్చు.',
                    'Click on any distributor in the left list to view their purchase invoices and payment ledger history.'
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOMER KHATA DIRECTORY & OVERDUE AGING ANALYSIS (Milestone 4.1)   */}
      {/* ========================================================================= */}
      {activeTab === 'CUSTOMERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN: Customers Directory List with Aging Filters (5 Cols) */}
          <div className="lg:col-span-5 apple-glass-card flex flex-col h-[700px] overflow-hidden">
            
            <div className="p-4 border-b border-white/60 bg-white/40 backdrop-blur-md flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slateBase-900 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-saudaBlue-600" />
                  <span>{t('కస్టమర్ ఖాతా & క్రెడిట్ మేనేజర్', 'Customer Khata & Credit Limits')}</span>
                </h2>
                <p className="text-[11px] text-slateBase-500 mt-0.5 font-medium">
                  {t('మొత్తం ఖాతాదారులు:', 'Registered Customers:')}{' '}
                  <strong className="text-slateBase-900 font-mono">{customers.length}</strong>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBulkSettlementModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-classicEmerald-50 hover:bg-classicEmerald-100 text-classicEmerald-700 border border-classicEmerald-200 font-bold rounded-xl text-xs transition shadow-sm active:scale-95"
                >
                  <Coins className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>{t('బల్క్ వసూళ్లు', 'Bulk Settle')}</span>
                </button>

                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white font-bold rounded-xl text-xs transition shadow-sm active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>{t('+ ఖాతా', '+ New')}</span>
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="p-3 border-b border-slateBase-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slateBase-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder={t('పేరు, ఫోన్ నెంబర్ లేదా ఊరు వెతకండి...', 'Search by customer name, phone or village...')}
                  className="w-full pl-9 pr-3 py-2.5 bg-slateBase-50 border border-slateBase-200 rounded-xl text-xs font-semibold text-slateBase-900 placeholder-slateBase-400 focus:outline-none focus:border-saudaBlue-600 transition"
                />
              </div>

              {/* Milestone 4.1: Aging Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] font-bold">
                <button
                  onClick={() => setAgingFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg border transition whitespace-nowrap ${
                    agingFilter === 'ALL'
                      ? 'bg-slateBase-900 text-white border-slateBase-900 shadow-sm'
                      : 'bg-white text-slateBase-600 border-slateBase-200 hover:bg-slateBase-50'
                  }`}
                >
                  {t('అన్నీ', 'All')} ({agingCounts.all})
                </button>

                <button
                  onClick={() => setAgingFilter('CURRENT_30')}
                  className={`px-2.5 py-1 rounded-lg border transition whitespace-nowrap flex items-center space-x-1 ${
                    agingFilter === 'CURRENT_30'
                      ? 'bg-classicEmerald-600 text-white border-classicEmerald-600 shadow-sm'
                      : 'bg-white text-classicEmerald-700 border-classicEmerald-200 hover:bg-classicEmerald-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    <span>0-30d</span>
                  </span>
                  <span className="opacity-80">({agingCounts.current30})</span>
                </button>

                <button
                  onClick={() => setAgingFilter('OVERDUE_31_60')}
                  className={`px-2.5 py-1 rounded-lg border transition whitespace-nowrap flex items-center space-x-1 ${
                    agingFilter === 'OVERDUE_31_60'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    <span>31-60d</span>
                  </span>
                  <span className="opacity-80">({agingCounts.overdue31_60})</span>
                </button>

                <button
                  onClick={() => setAgingFilter('OVERDUE_60_PLUS')}
                  className={`px-2.5 py-1 rounded-lg border transition whitespace-nowrap flex items-center space-x-1 ${
                    agingFilter === 'OVERDUE_60_PLUS'
                      ? 'bg-classicCrimson-600 text-white border-classicCrimson-600 shadow-sm'
                      : 'bg-white text-classicCrimson-700 border-classicCrimson-200 hover:bg-classicCrimson-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    <span>60+d</span>
                  </span>
                  <span className="opacity-80">({agingCounts.overdue60Plus})</span>
                </button>

                <button
                  onClick={() => setAgingFilter('OVER_LIMIT')}
                  className={`px-2.5 py-1 rounded-lg border transition whitespace-nowrap flex items-center space-x-1 ${
                    agingFilter === 'OVER_LIMIT'
                      ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                      : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    <span>{t('లిమిట్ దాటినవి', 'Over Limit')}</span>
                  </span>
                  <span className="opacity-80">({agingCounts.overLimit})</span>
                </button>
              </div>
            </div>

            {/* Customer Scroll List with Overdue & Credit Badges */}
            <div className="flex-1 overflow-y-auto divide-y divide-slateBase-100">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slateBase-400 font-medium">
                  {t('ఎంచుకున్న ఫిల్టర్‌కు సరిపోయే ఖాతాదారులు లేరు', 'No customers found matching selected filter')}
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const balance = getCustomerBalancePaise(c.id);
                  const isSelected = selectedCustomer?.id === c.id;
                  const aging = calculateCustomerAging(c.id, customerLedger);
                  const limit = c.creditLimitPaise || 500000;
                  const util = getCreditUtilization(balance, limit);

                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className={`w-full p-3.5 text-left transition flex flex-col space-y-2 ${
                        isSelected 
                          ? 'bg-saudaBlue-50/80 border-l-4 border-saudaBlue-600 shadow-inner' 
                          : 'hover:bg-slateBase-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="font-bold text-sm text-slateBase-900 truncate">{c.fullName}</div>
                          <div className="text-[11px] text-slateBase-500 flex items-center space-x-1.5 mt-0.5 font-medium">
                            <span className="font-mono text-slateBase-700">{c.customerCode}</span>
                            {c.phone && <span>• {c.phone}</span>}
                            {c.villageCity && <span>• {c.villageCity}</span>}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div
                            className={`font-black text-sm tnum ${
                              balance > 0 ? 'text-classicCrimson-600' : balance < 0 ? 'text-classicEmerald-700' : 'text-slateBase-400'
                            }`}
                          >
                            {formatPaise(balance)}
                          </div>
                          
                          {/* Aging and Limit Badge */}
                          <div className="mt-0.5">
                            {balance <= 0 ? (
                              <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-slateBase-100 text-slateBase-600 uppercase tracking-wider">
                                {t('సరిపోయింది', 'Settled')}
                              </span>
                            ) : util.isBreached ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                <span className="w-1 h-1 rounded-full bg-current" />
                                {t('పరిమితి దాటింది', 'Over Limit')}
                              </span>
                            ) : aging.overdue60PlusPaise > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1 h-1 rounded-full bg-current" />
                                60+d ({aging.oldestUnpaidDays}d)
                              </span>
                            ) : aging.overdue31To60Paise > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1 h-1 rounded-full bg-current" />
                                31-60d ({aging.oldestUnpaidDays}d)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1 h-1 rounded-full bg-current" />
                                0-30d
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mini Credit Utilization Bar */}
                      <div className="w-full pt-1">
                        <div className="flex justify-between items-center text-[10px] text-slateBase-400 font-medium mb-1">
                          <span>{t('పరిమితి:', 'Limit:')} {formatPaise(limit)}</span>
                          <span className={`font-mono font-bold ${util.isBreached ? 'text-rose-600' : util.isWarning ? 'text-amber-600' : 'text-slateBase-600'}`}>
                            {util.percent}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slateBase-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              util.isBreached
                                ? 'bg-classicCrimson-600'
                                : util.isWarning
                                ? 'bg-amber-500'
                                : 'bg-classicEmerald-500'
                            }`}
                            style={{ width: `${Math.min(100, util.percent)}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Customer Profile, Credit Limit & Overdue Aging Bento Studio (7 Cols) */}
          <div className="lg:col-span-7 apple-glass-card flex flex-col h-[700px] overflow-hidden">
            {selectedCustomer ? (
              <>
                {/* Customer Profile Banner */}
                <div className="p-4 border-b border-white/60 bg-white/40 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slateBase-900">{selectedCustomer.fullName}</h3>
                      <span className="text-[10px] font-bold bg-white text-slateBase-700 px-2 py-0.5 rounded-full font-mono border border-slateBase-300">
                        {selectedCustomer.customerCode}
                      </span>
                      <span className="text-[9px] font-bold bg-saudaBlue-50 text-saudaBlue-700 px-1.5 py-0.5 rounded border border-saudaBlue-200">
                        {selectedCustomer.customerType}
                      </span>
                    </div>
                    <div className="text-xs text-slateBase-500 flex items-center space-x-3 mt-1 font-medium">
                      {selectedCustomer.phone && (
                        <span className="flex items-center">
                          <Phone className="w-3.5 h-3.5 mr-1 text-slateBase-400" />
                          {selectedCustomer.phone}
                        </span>
                      )}
                      {selectedCustomer.villageCity && (
                        <span className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slateBase-400" />
                          {selectedCustomer.villageCity}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Highlighted Balance Card */}
                  <div className="p-3 rounded-xl bg-white border border-classicCrimson-200 text-right shadow-card">
                    <div className="text-[10px] font-bold text-slateBase-500 uppercase tracking-wider">
                      {t('మొత్తం బాకీ (Total Due)', 'Total Due Balance')}
                    </div>
                    <div className="text-xl font-syne font-black text-classicCrimson-600 tnum mt-0.5">
                      {formatPaise(currentCustBalancePaise)}
                    </div>
                  </div>
                </div>

                {/* Milestone 4.1: Credit Limit & Utilization Widget */}
                <div className="p-3.5 border-b border-slateBase-200 bg-slateBase-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slateBase-800 flex items-center">
                        <CreditCard className="w-3.5 h-3.5 mr-1.5 text-saudaBlue-600" />
                        {t('క్రెడిట్ పరిమితి (Credit Limit):', 'Credit Limit:')}
                      </span>
                      <span className="text-xs font-black text-slateBase-900 font-mono">
                        {formatPaise(selectedCustomer.creditLimitPaise || 500000)}
                      </span>
                      <button
                        onClick={handleOpenCreditLimitModal}
                        className="text-[10px] font-bold text-saudaBlue-600 hover:text-saudaBlue-800 bg-saudaBlue-50 hover:bg-saudaBlue-100 border border-saudaBlue-200 px-2 py-0.5 rounded-lg flex items-center space-x-1 transition ml-1"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>{t('పరిమితి మార్చు', 'Edit Limit')}</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditCustomer(selectedCustomer)}
                        className="text-[10px] font-bold text-slateBase-700 hover:text-saudaBlue-600 bg-white hover:bg-slateBase-50 border border-slateBase-200 px-2 py-0.5 rounded-lg flex items-center space-x-1 transition ml-1 shadow-2xs"
                        title={t('కస్టమర్ ప్రొఫైల్ సవరణ', 'Edit Customer Profile')}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{t('ప్రొఫైల్ సవరణ', 'Edit Profile')}</span>
                      </button>
                    </div>

                    <div className="text-right">
                      {currentCustUtil?.isBreached ? (
                        <span className="text-[11px] font-bold text-rose-600 flex items-center">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                          {t('పరిమితి కంటే', 'Exceeded by')} +{formatPaise(currentCustUtil.excessPaise)} {t('ఎక్కువ', 'over')}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-classicEmerald-700">
                          {formatPaise(currentCustUtil?.remainingPaise || 0)} {t('అందుబాటులో ఉంది', 'available')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="w-full h-2 bg-slateBase-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        currentCustUtil?.isBreached
                          ? 'bg-classicCrimson-600'
                          : currentCustUtil?.isWarning
                          ? 'bg-amber-500'
                          : 'bg-classicEmerald-500'
                      }`}
                      style={{ width: `${Math.min(100, currentCustUtil?.percent || 0)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slateBase-500 mt-1 font-medium">
                    <span>{t('వినియోగం (Utilization):', 'Utilization:')} <strong className="text-slateBase-900">{currentCustUtil?.percent || 0}%</strong></span>
                    {currentCustUtil?.isBreached && (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
                        {t('POS లో మేనేజర్ అనుమతి అవసరం', 'Manager Override needed in POS')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Milestone 4.1: 30/60/90-Day Overdue Aging Analysis Studio */}
                <div className="p-3.5 border-b border-slateBase-200 bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs font-bold text-slateBase-800 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-saudaBlue-600" />
                      <span>{t('గడువు విశ్లేషణ (FIFO Overdue Aging Analysis)', 'FIFO Overdue Aging Analysis')}</span>
                    </div>
                    {currentCustAging && currentCustAging.oldestUnpaidDays > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slateBase-100 text-slateBase-700">
                        {t('పాత బాకీ:', 'Oldest Unpaid:')} <strong className="font-mono">{currentCustAging.oldestUnpaidDays} {t('రోజుల క్రితం', 'days ago')}</strong>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    {/* Bucket 1: 0-30 Days */}
                    <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200">
                      <div className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">
                        0 - 30 {t('రోజులు', 'Days')}
                      </div>
                      <div className="text-xs font-black text-emerald-700 font-mono mt-0.5 tnum">
                        {formatPaise(currentCustAging?.current0To30Paise || 0)}
                      </div>
                      <div className="text-[9px] text-emerald-600 font-medium">
                        {t('సాధారణం', 'Normal')}
                      </div>
                    </div>

                    {/* Bucket 2: 31-60 Days */}
                    <div className={`p-2 rounded-xl border ${
                      (currentCustAging?.overdue31To60Paise || 0) > 0 
                        ? 'bg-amber-50 border-amber-300' 
                        : 'bg-slateBase-50 border-slateBase-200'
                    }`}>
                      <div className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">
                        31 - 60 {t('రోజులు', 'Days')}
                      </div>
                      <div className="text-xs font-black text-amber-700 font-mono mt-0.5 tnum">
                        {formatPaise(currentCustAging?.overdue31To60Paise || 0)}
                      </div>
                      <div className="text-[9px] text-amber-600 font-medium">
                        {t('గడువు దాటినవి', 'Overdue')}
                      </div>
                    </div>

                    {/* Bucket 3: 61-90 Days */}
                    <div className={`p-2 rounded-xl border ${
                      (currentCustAging?.overdue61To90Paise || 0) > 0 
                        ? 'bg-orange-50 border-orange-300' 
                        : 'bg-slateBase-50 border-slateBase-200'
                    }`}>
                      <div className="text-[9px] font-bold text-orange-800 uppercase tracking-wider">
                        61 - 90 {t('రోజులు', 'Days')}
                      </div>
                      <div className="text-xs font-black text-orange-700 font-mono mt-0.5 tnum">
                        {formatPaise(currentCustAging?.overdue61To90Paise || 0)}
                      </div>
                      <div className="text-[9px] text-orange-600 font-medium">
                        {t('ఆలస్యం', 'Delayed')}
                      </div>
                    </div>

                    {/* Bucket 4: 90+ Days */}
                    <div className={`p-2 rounded-xl border ${
                      (currentCustAging?.overdue90PlusPaise || 0) > 0 
                        ? 'bg-rose-50 border-rose-300' 
                        : 'bg-slateBase-50 border-slateBase-200'
                    }`}>
                      <div className="text-[9px] font-bold text-rose-800 uppercase tracking-wider">
                        90+ {t('రోజులు', 'Days')}
                      </div>
                      <div className="text-xs font-black text-rose-700 font-mono mt-0.5 tnum">
                        {formatPaise(currentCustAging?.overdue90PlusPaise || 0)}
                      </div>
                      <div className="text-[9px] text-rose-600 font-medium">
                        {t('అత్యవసరం', 'Critical')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Milestone 4.3: Simple Interest Calculation Studio (వడ్డీ లెక్కల స్టూడియో) */}
                <div className="p-3.5 border-b border-slateBase-200 bg-slateBase-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-xs font-mono">
                        %
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slateBase-900">
                          {t('వడ్డీ లెక్కలు (Simple Interest Studio)', 'Simple Interest Studio')}
                        </span>
                        <span className="ml-2 text-[10px] text-slateBase-500 font-medium">
                          {interestRate}% p.a. • {gracePeriodDays} {t('రోజుల గ్రేస్', 'days grace')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpdateCustomerInterestSettings(interestRate, gracePeriodDays, !isInterestActive)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center space-x-1.5 border ${
                        isInterestActive
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white text-slateBase-600 border-slateBase-200 hover:bg-slateBase-100'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {isInterestActive ? (
                          <>
                            {t('వడ్డీ వర్తిస్తుంది', 'Interest Enabled')}
                            <Check className="h-3 w-3" strokeWidth={2.5} />
                          </>
                        ) : (
                          t('+ వడ్డీని ప్రారంభించు', '+ Enable Interest')
                        )}
                      </span>
                    </button>
                  </div>

                  {isInterestActive && (
                    <div className="mt-2.5 pt-2.5 border-t border-slateBase-200/80 space-y-2.5">
                      {/* Rate & Grace Period Selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Annual Rate Presets */}
                        <div>
                          <label className="block text-[10px] font-bold text-slateBase-600 mb-1 uppercase tracking-wider">
                            {t('వడ్డీ రేటు (Annual Rate %)', 'Annual Rate %')}
                          </label>
                          <div className="grid grid-cols-4 gap-1">
                            {INTEREST_RATE_PRESETS.map((p) => {
                              const isSelected = interestRate === p.percent;
                              return (
                                <button
                                  key={p.percent}
                                  type="button"
                                  onClick={() => handleUpdateCustomerInterestSettings(p.percent, gracePeriodDays, true)}
                                  className={`py-1 px-1 rounded-lg text-[10px] font-bold font-mono transition border text-center ${
                                    isSelected
                                      ? 'bg-slateBase-900 text-white border-slateBase-900 shadow-sm'
                                      : 'bg-white text-slateBase-700 border-slateBase-200 hover:bg-slateBase-50'
                                  }`}
                                  title={p.label}
                                >
                                  {p.percent}%
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Grace Period Presets */}
                        <div>
                          <label className="block text-[10px] font-bold text-slateBase-600 mb-1 uppercase tracking-wider">
                            {t('గ్రేస్ పీరియడ్ (Grace Period)', 'Grace Period')}
                          </label>
                          <div className="grid grid-cols-4 gap-1">
                            {GRACE_PERIOD_PRESETS.map((g) => {
                              const isSelected = gracePeriodDays === g.days;
                              return (
                                <button
                                  key={g.days}
                                  type="button"
                                  onClick={() => handleUpdateCustomerInterestSettings(interestRate, g.days, true)}
                                  className={`py-1 px-1 rounded-lg text-[10px] font-bold font-mono transition border text-center ${
                                    isSelected
                                      ? 'bg-slateBase-900 text-white border-slateBase-900 shadow-sm'
                                      : 'bg-white text-slateBase-700 border-slateBase-200 hover:bg-slateBase-50'
                                  }`}
                                  title={g.label}
                                >
                                  {g.days}d
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Calculated Breakdown Bento Ribbon */}
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-3 text-xs font-medium">
                          <div>
                            <div className="text-[9px] text-slateBase-500 font-bold uppercase">{t('అసలు', 'Principal')}</div>
                            <div className="font-mono font-bold text-slateBase-900 text-xs">{formatPaise(currentCustBalancePaise)}</div>
                          </div>
                          <div className="text-amber-600 font-bold text-sm">+</div>
                          <div>
                            <div className="text-[9px] text-amber-800 font-bold uppercase">
                              {t('వడ్డీ', 'Interest')} ({customerInterest?.chargeableDays || 0}d)
                            </div>
                            <div className="font-mono font-black text-amber-700 text-xs">
                              {formatPaise(customerInterest?.accruedInterestPaise || 0)}
                            </div>
                          </div>
                          <div className="text-slateBase-400 font-bold text-sm">=</div>
                          <div>
                            <div className="text-[9px] text-slateBase-600 font-bold uppercase">{t('మొత్తం బాకీ', 'Total Due')}</div>
                            <div className="font-mono font-black text-classicCrimson-600 text-xs">
                              {formatPaise(currentCustBalancePaise + (customerInterest?.accruedInterestPaise || 0))}
                            </div>
                          </div>
                        </div>

                        {/* Action Button: Post Interest to Ledger */}
                        {(customerInterest?.accruedInterestPaise || 0) > 0 && (
                          <button
                            type="button"
                            onClick={handlePostInterestToLedger}
                            className="py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition active:scale-95 flex items-center space-x-1"
                          >
                            <Coins className="w-3 h-3 stroke-[2.2]" />
                            <span>{t('వడ్డీని లెడ్జర్‌లో నమోదు చేయి', 'Post to Ledger')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons: Gave, Got, WhatsApp */}
                <div className="p-3 border-b border-slateBase-200 grid grid-cols-3 gap-2.5 bg-white">
                  <button
                    onClick={() => setShowCustomerTxModal('DEBIT')}
                    className="py-2.5 px-3 bg-classicCrimson-600 hover:bg-classicCrimson-700 text-white rounded-xl font-bold text-xs flex items-center justify-center transition shadow-sm active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    {t('ఇచ్చినవి (ఉధార్ +)', 'Gave (Udhar +)')}
                  </button>

                  <button
                    onClick={() => setShowCustomerTxModal('CREDIT')}
                    className="py-2.5 px-3 bg-classicEmerald-600 hover:bg-classicEmerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center transition shadow-sm active:scale-95"
                  >
                    <MinusCircle className="w-4 h-4 mr-1.5" />
                    {t('వచ్చినవి (జమా -)', 'Got (Jama -)')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowWhatsAppModal(true)}
                    className="py-2.5 px-3 bg-white hover:bg-classicEmerald-50 text-classicEmerald-700 border border-classicEmerald-300 rounded-[10px] font-bold text-xs flex items-center justify-center transition active:scale-95"
                  >
                    <Share2 className="w-4 h-4 mr-1.5 text-classicEmerald-600" />
                    {t('వాట్సాప్ స్టేట్‌మెంట్', 'WhatsApp Statement')}
                  </button>
                </div>

                {/* Transaction Ledger Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {currentCustomerEntries.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slateBase-400 font-medium">
                      {t('ఎటువంటి లావాదేవీలు లేవు', 'No transactions recorded yet in ledger')}
                    </div>
                  ) : (
                    currentCustomerEntries.map((e) => {
                      const isDebit = e.entryType === 'DEBIT_SALE';
                      return (
                        <div
                          key={e.id}
                          className={`p-3 rounded-xl border transition flex items-center justify-between ${
                            isDebit 
                              ? 'bg-classicCrimson-50/40 border-classicCrimson-100' 
                              : 'bg-classicEmerald-50/40 border-classicEmerald-100'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs text-slateBase-900">
                              {e.notes || (isDebit ? t('ఉధార్ విక్రయం', 'Credit Sale') : t('చెల్లింపు జమా', 'Payment Received'))}
                            </div>
                            <div className="text-[10px] text-slateBase-400 flex items-center space-x-1 mt-1 font-medium">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(e.timestamp).toLocaleDateString()} {new Date(e.timestamp).toLocaleTimeString()}</span>
                              {e.paymentMethod && <span className="font-mono text-slateBase-500">• {e.paymentMethod}</span>}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <div
                                className={`font-syne font-black text-sm tnum ${
                                  isDebit ? 'text-classicCrimson-600' : 'text-classicEmerald-700'
                                }`}
                              >
                                {isDebit ? '+' : '-'} {formatPaise(e.amountPaise)}
                              </div>
                              <div className="text-[10px] text-slateBase-400 font-bold uppercase tracking-wider">
                                {isDebit ? t('బాకీ', 'Udhar') : t('జమా', 'Jama')}
                              </div>
                            </div>
                            <button
                              data-testid={`edit-khata-entry-${e.id}`}
                              onClick={() => handleOpenEditEntry(e.id, e.amountPaise, e.notes || '', 'CUSTOMER')}
                              className="p-1.5 text-slateBase-400 hover:text-saudaBlue-600 hover:bg-saudaBlue-50 rounded-lg transition"
                              title={t('ఎంట్రీ మొత్తం / నోట్ సవరించు', 'Edit Entry Amount / Notes')}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              data-testid={`delete-khata-entry-${e.id}`}
                              onClick={() => handleDeleteCustomerEntry(e.id)}
                              className="p-1.5 text-slateBase-400 hover:text-classicCrimson-600 hover:bg-classicCrimson-50 rounded-lg transition"
                              title={t('ఎంట్రీ రద్దు చేయండి', 'Void / Delete Entry')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slateBase-400">
                <BookOpen className="w-12 h-12 stroke-[1.2] text-slateBase-300 mb-2" />
                <p className="text-sm font-semibold text-slateBase-600">
                  {t('ఖాతాదారుని ఎంచుకోండి', 'Select a customer from directory')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW SUPPLIER (Phase 2 Milestone 2.2)                         */}
      {/* ========================================================================= */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slateBase-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slateBase-200 bg-slateBase-50/70 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
                <Truck className="w-4 h-4 mr-2 text-saudaBlue-600" />
                <span>{t('కొత్త సప్లయర్ / డిస్ట్రిబ్యూటర్ నమోదు', 'Register New Supplier / Distributor')}</span>
              </h3>
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="p-1 rounded-lg text-slateBase-400 hover:text-slateBase-700 hover:bg-slateBase-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('ఏజెన్సీ / డిస్ట్రిబ్యూటర్ పేరు *', 'Agency / Distributor Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="e.g. Sri Srinivasa ITC Agencies"
                  className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('కాంటాక్ట్ పర్సన్ *', 'Contact Person *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. వెంకటేశ్వర్లు గారు"
                    className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('ఫోన్ నెంబర్ *', 'Phone Number *')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="9440123456"
                    className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('GSTIN (ఐచ్ఛికం)', 'GSTIN (Optional)')}
                  </label>
                  <input
                    type="text"
                    value={supplierGstin}
                    onChange={(e) => setSupplierGstin(e.target.value)}
                    placeholder="36AAACS1234F1Z5"
                    className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('క్రెడిట్ గడువు (రోజులు)', 'Credit Terms (Days)')}
                  </label>
                  <input
                    type="number"
                    value={creditPeriodDays}
                    onChange={(e) => setCreditPeriodDays(Number(e.target.value))}
                    min={0}
                    max={180}
                    className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('మార్కెట్ / అడ్రస్', 'Address / Area')}
                  </label>
                  <input
                    type="text"
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    placeholder="Shop #42, Wholesale Grain Market"
                    className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('నగరం / ఊరు', 'City / Town')}
                  </label>
                  <input
                    type="text"
                    value={supplierCity}
                    onChange={(e) => setSupplierCity(e.target.value)}
                    placeholder="Koti, Hyderabad"
                    className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('సప్లై చేసే వస్తువులు / బ్రాండ్లు (కామాలతో విభజించండి)', 'Supplied Categories / Brands (comma-separated)')}
                </label>
                <input
                  type="text"
                  value={categoriesInput}
                  onChange={(e) => setCategoriesInput(e.target.value)}
                  placeholder="e.g. Atta, Biscuits, Freedom Oil, Soap"
                  className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                />
              </div>

              <div className="pt-3 border-t border-slateBase-200 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-700 hover:bg-slateBase-50"
                >
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {t('సప్లయర్ ని సేవ్ చేయండి', 'Save Supplier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SUPPLIER INWARD / PAYMENT (Phase 2 Milestone 2.2)                */}
      {/* ========================================================================= */}
      {showSupplierTxModal && selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slateBase-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slateBase-200 bg-slateBase-50/70 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
                {showSupplierTxModal === 'INWARD' ? (
                  <>
                    <ArrowDownLeft className="w-4 h-4 mr-2 text-classicCrimson-600" />
                    <span>{t('సరుకు కొనుగోలు రికార్డు (+ బాకీ)', 'Record Stock Inward Bill (+ Due)')}</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 mr-2 text-classicEmerald-600" />
                    <span>{t('సప్లయర్ కి చెల్లింపు రికార్డు (- బాకీ తగ్గించండి)', 'Record Payment to Supplier (- Due)')}</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowSupplierTxModal(null)}
                className="p-1 rounded-lg text-slateBase-400 hover:text-slateBase-700 hover:bg-slateBase-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pt-3 pb-1 text-xs text-slateBase-600 font-medium">
              {t('డిస్ట్రిబ్యూటర్:', 'Distributor:')} <strong className="text-slateBase-900">{selectedSupplier.agencyName}</strong>
            </div>

            <form onSubmit={handleAddSupplierTransaction} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('మొత్తం (₹) *', 'Amount (₹) *')}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slateBase-400 font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    autoFocus
                    value={supplierAmountInput}
                    onChange={(e) => setSupplierAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2.5 bg-slateBase-50 border border-slateBase-300 rounded-xl text-lg font-syne font-black text-slateBase-900 focus:outline-none focus:border-saudaBlue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {showSupplierTxModal === 'INWARD' 
                    ? t('ఇన్వాయిస్ / బిల్లు నెంబర్', 'Distributor Invoice / Bill Number')
                    : t('చెల్లింపు రసీదు / UTR నెంబర్', 'Payment Receipt / UTR Ref')}
                </label>
                <input
                  type="text"
                  value={supplierInvoiceNo}
                  onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                  placeholder={showSupplierTxModal === 'INWARD' ? 'e.g. INV-ITC-9901' : 'e.g. UPI-998822019'}
                  className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600 font-mono"
                />
              </div>

              {showSupplierTxModal === 'PAYMENT' && (
                <div>
                  <label className="block text-xs font-bold text-slateBase-700 mb-1">
                    {t('చెల్లింపు విధానం (Payment Mode)', 'Payment Method')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['BANK_TRANSFER', 'UPI', 'CASH'] as PaymentMethod[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSupplierPaymentMethod(mode)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition border ${
                          supplierPaymentMethod === mode
                            ? 'bg-saudaBlue-50 border-saudaBlue-600 text-saudaBlue-800'
                            : 'bg-white border-slateBase-200 text-slateBase-600 hover:bg-slateBase-50'
                        }`}
                      >
                        {mode === 'BANK_TRANSFER' ? 'NEFT / RTGS' : mode}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('వివరాలు / నోట్స్', 'Notes / Description')}
                </label>
                <input
                  type="text"
                  value={supplierNotesInput}
                  onChange={(e) => setSupplierNotesInput(e.target.value)}
                  placeholder={
                    showSupplierTxModal === 'INWARD' 
                      ? 'e.g. 15 Cartons Freedom Oil' 
                      : 'e.g. Partial settlement for invoice 8921'
                  }
                  className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                />
              </div>

              <div className="pt-3 border-t border-slateBase-200 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowSupplierTxModal(null)}
                  className="px-4 py-2 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-700 hover:bg-slateBase-50"
                >
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-sm ${
                    showSupplierTxModal === 'INWARD' 
                      ? 'bg-slateBase-900 hover:bg-slateBase-800' 
                      : 'bg-classicEmerald-600 hover:bg-classicEmerald-700'
                  }`}
                >
                  {showSupplierTxModal === 'INWARD' 
                    ? t('ఇన్వర్డ్ సేవ్ చేయండి', 'Record Inward Bill') 
                    : t('చెల్లింపు నమోదు చేయండి', 'Record Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD NEW CUSTOMER (Original Screen)                               */}
      {/* ========================================================================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slateBase-200">
            <div className="p-4 border-b border-slateBase-200 bg-slateBase-50/70 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
                <UserPlus className="w-4 h-4 mr-2 text-saudaBlue-600" />
                <span>{t('కొత్త కస్టమర్ ఖాతా తెరవండి', 'Open New Customer Khata')}</span>
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 rounded-lg text-slateBase-400 hover:text-slateBase-700 hover:bg-slateBase-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('కస్టమర్ పూర్తి పేరు *', 'Full Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={newCustFullName}
                  onChange={(e) => setNewCustFullName(e.target.value)}
                  placeholder="e.g. రాము గారు"
                  className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('ఫోన్ నెంబర్ (వాట్సాప్ అలర్ట్స్ కోసం)', 'Phone Number (for WhatsApp alerts)')}
                </label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="9848022338"
                  className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('ఊరు / వీధి / ఏరియా', 'Village / Street / Area')}
                </label>
                <input
                  type="text"
                  value={newCustVillageCity}
                  onChange={(e) => setNewCustVillageCity(e.target.value)}
                  placeholder="e.g. Gandhi Nagar"
                  className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('కస్టమర్ రకం', 'Customer Type')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCustType('RETAIL')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      newCustType === 'RETAIL'
                        ? 'bg-saudaBlue-50 border-saudaBlue-600 text-saudaBlue-800'
                        : 'bg-white border-slateBase-200 text-slateBase-600'
                    }`}
                  >
                    {t('రిటైల్ కస్టమర్', 'Retail')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCustType('BUSINESS')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                      newCustType === 'BUSINESS'
                        ? 'bg-saudaBlue-50 border-saudaBlue-600 text-saudaBlue-800'
                        : 'bg-white border-slateBase-200 text-slateBase-600'
                    }`}
                  >
                    {t('వ్యాపారం / హోటల్', 'Business / Hotel')}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slateBase-200 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-700 hover:bg-slateBase-50"
                >
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {t('ఖాతా తెరవండి', 'Create Khata')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CUSTOMER TRANSACTION (Gave / Got)                                */}
      {/* ========================================================================= */}
      {showCustomerTxModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slateBase-200">
            <div className="p-4 border-b border-slateBase-200 bg-slateBase-50/70 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
                {showCustomerTxModal === 'DEBIT' ? (
                  <>
                    <PlusCircle className="w-4 h-4 mr-2 text-classicCrimson-600" />
                    <span>{t('ఉధార్ ఇచ్చినవి (+)', 'Gave on Credit (+)')}</span>
                  </>
                ) : (
                  <>
                    <MinusCircle className="w-4 h-4 mr-2 text-classicEmerald-600" />
                    <span>{t('నగదు జమా (-)', 'Received Cash (-)')}</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowCustomerTxModal(null)}
                className="p-1 rounded-lg text-slateBase-400 hover:text-slateBase-700 hover:bg-slateBase-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pt-3 pb-1 text-xs text-slateBase-600 font-medium">
              {t('కస్టమర్:', 'Customer:')} <strong className="text-slateBase-900">{selectedCustomer.fullName}</strong>
            </div>

            <form onSubmit={handleAddCustomerTransaction} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('మొత్తం (₹) *', 'Amount (₹) *')}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slateBase-400 font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    autoFocus
                    value={customerAmountInput}
                    onChange={(e) => setCustomerAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2.5 bg-slateBase-50 border border-slateBase-300 rounded-xl text-lg font-syne font-black text-slateBase-900 focus:outline-none focus:border-saudaBlue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('వివరాలు / సరుకుల వివరాలు', 'Description / Items')}
                </label>
                <input
                  type="text"
                  value={customerNotesInput}
                  onChange={(e) => setCustomerNotesInput(e.target.value)}
                  placeholder={showCustomerTxModal === 'DEBIT' ? 'e.g. 5kg బియ్యం, నూనె ప్యాకెట్' : 'e.g. గూగుల్ పే ద్వారా జమా'}
                  className="w-full px-3 py-2 bg-slateBase-50 border border-slateBase-300 rounded-xl text-xs font-semibold text-slateBase-900 focus:outline-none focus:border-saudaBlue-600"
                />
              </div>

              <div className="pt-3 border-t border-slateBase-200 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowCustomerTxModal(null)}
                  className="px-4 py-2 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-700 hover:bg-slateBase-50"
                >
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-sm ${
                    showCustomerTxModal === 'DEBIT' 
                      ? 'bg-classicCrimson-600 hover:bg-classicCrimson-700' 
                      : 'bg-classicEmerald-600 hover:bg-classicEmerald-700'
                  }`}
                >
                  {showCustomerTxModal === 'DEBIT' ? t('ఉధార్ నమోదు', 'Save Udhar') : t('జమా నమోదు', 'Save Jama')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT CUSTOMER CREDIT LIMIT (Milestone 4.1)                       */}
      {/* ========================================================================= */}
      {showEditCreditLimitModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slateBase-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slateBase-200 bg-slateBase-50/70 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
                <CreditCard className="w-4 h-4 mr-2 text-saudaBlue-600" />
                <span>{t('క్రెడిట్ పరిమితి సెట్టింగ్', 'Set Customer Credit Limit')}</span>
              </h3>
              <button
                onClick={() => setShowEditCreditLimitModal(false)}
                className="p-1 rounded-lg text-slateBase-400 hover:text-slateBase-700 hover:bg-slateBase-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pt-4 pb-1">
              <div className="text-sm font-bold text-slateBase-900">{selectedCustomer.fullName}</div>
              <div className="text-xs text-slateBase-500 font-medium">
                {selectedCustomer.customerCode} • {t('ప్రస్తుత బాకీ:', 'Current Due:')}{' '}
                <strong className="text-classicCrimson-600 font-mono">{formatPaise(currentCustBalancePaise)}</strong>
              </div>
            </div>

            <form onSubmit={handleUpdateCreditLimit} className="p-5 space-y-4">
              {/* Quick Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slateBase-600 mb-1.5 uppercase tracking-wider">
                  {t('త్వరిత పరిమితి ఎంపికలు (Quick Presets)', 'Quick Presets')}
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {PRESET_CREDIT_LIMITS.map((p) => {
                    const isSelected = Math.round(Number(editCreditLimitInput) * 100) === p.paise;
                    return (
                      <button
                        key={p.paise}
                        type="button"
                        onClick={() => setEditCreditLimitInput((p.paise / 100).toString())}
                        className={`py-1.5 px-1 rounded-xl text-xs font-bold font-mono transition border ${
                          isSelected
                            ? 'bg-saudaBlue-600 text-white border-saudaBlue-600 shadow-sm'
                            : 'bg-slateBase-50 text-slateBase-700 border-slateBase-200 hover:bg-slateBase-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Input */}
              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('పరిమితి మొత్తం (రూపాయల్లో / ₹) *', 'Credit Limit Amount (₹) *')}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slateBase-400 font-mono">₹</span>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    required
                    autoFocus
                    value={editCreditLimitInput}
                    onChange={(e) => setEditCreditLimitInput(e.target.value)}
                    placeholder="5000"
                    className="w-full pl-9 pr-3 py-2.5 bg-slateBase-50 border border-slateBase-300 rounded-xl text-lg font-syne font-black text-slateBase-900 focus:outline-none focus:border-saudaBlue-600 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slateBase-400 mt-1 font-medium">
                  {t(
                    'ఉధార్ ఈ పరిమితిని దాటినప్పుడు POS బిల్లింగ్ వద్ద ఆటోమేటిక్ అలర్ట్ వస్తుంది.',
                    'POS terminal will alert cashiers when credit limit is exceeded.'
                  )}
                </p>
              </div>

              <div className="pt-3 border-t border-slateBase-200 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditCreditLimitModal(false)}
                  className="px-4 py-2 border border-slateBase-300 rounded-xl text-xs font-bold text-slateBase-700 hover:bg-slateBase-50"
                >
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
                >
                  {t('పరిమితి భద్రపరచు', 'Save Credit Limit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: WHATSAPP PAYMENT LINK & STATEMENT DISPATCHER (Milestone 4.2)     */}
      {/* ========================================================================= */}
      {showWhatsAppModal && selectedCustomer && (
        <WhatsAppReminderModal
          customer={selectedCustomer}
          currentBalancePaise={currentCustBalancePaise}
          oldestUnpaidDays={currentCustAging?.oldestUnpaidDays || 0}
          shop={currentShop}
          onClose={() => setShowWhatsAppModal(false)}
          formatPaise={formatPaise}
          t={t}
          accruedInterestPaise={isInterestActive ? (customerInterest?.accruedInterestPaise || 0) : 0}
          annualInterestRatePercent={interestRate}
          chargeableInterestDays={customerInterest?.chargeableDays || 0}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: MULTI-CUSTOMER BULK SETTLEMENT STUDIO (Milestone 4.4)            */}
      {/* ========================================================================= */}
      {showBulkSettlementModal && (
        <BulkSettlementModal
          customers={customers}
          customerLedger={customerLedger}
          getCustomerBalancePaise={getCustomerBalancePaise}
          formatPaise={formatPaise}
          t={t}
          onClose={() => setShowBulkSettlementModal(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: EDIT LEDGER TRANSACTION ENTRY (Mistake Rectification)            */}
      {/* ========================================================================= */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="apple-glass-card max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-white/40 flex justify-between items-center bg-white/40">
              <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
                <Edit3 className="w-4 h-4 mr-2 text-saudaBlue-600" />
                <span>{t('లావాదేవీ సవరణ (Edit Transaction Entry)', 'Edit Transaction Entry')}</span>
              </h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="p-1 rounded-xl text-slateBase-400 hover:text-slateBase-700 hover:bg-white/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditEntry} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('సవరించిన మొత్తం (₹) *', 'Corrected Amount (₹) *')}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slateBase-400 font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    autoFocus
                    value={editEntryAmountInput}
                    onChange={(e) => setEditEntryAmountInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white/80 border border-slateBase-200/80 rounded-xl text-lg font-syne font-black text-slateBase-900 focus:outline-none focus:ring-2 focus:ring-saudaBlue-500/20 focus:border-saudaBlue-500 font-mono shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('వివరాలు / నోట్స్ (Notes & Reason)', 'Notes / Reference Reason')}
                </label>
                <input
                  type="text"
                  value={editEntryNotesInput}
                  onChange={(e) => setEditEntryNotesInput(e.target.value)}
                  placeholder={t('ఉదా: తప్పుగా ఎంటర్ చేసిన బిల్లు సవరణ', 'e.g. Corrected typo in invoice')}
                  className="w-full px-3 py-2 bg-white/80 border border-slateBase-200/80 rounded-xl text-xs font-medium text-slateBase-900 focus:outline-none focus:ring-2 focus:ring-saudaBlue-500/20 focus:border-saudaBlue-500"
                />
              </div>

              <div className="pt-3 border-t border-slateBase-200/60 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 border border-slateBase-300/80 rounded-xl text-xs font-bold text-slateBase-700 bg-white/60 hover:bg-white transition"
                >
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
                >
                  {t('సవరణ భద్రపరచు', 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: EDIT CUSTOMER PROFILE (Mistake Rectification)                     */}
      {/* ========================================================================= */}
      {editingCustomerProfile && (
        <div className="fixed inset-0 z-50 bg-slateBase-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="apple-glass-card max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-white/40 flex justify-between items-center bg-white/40">
              <h3 className="text-sm font-bold text-slateBase-900 flex items-center">
                <Edit3 className="w-4 h-4 mr-2 text-saudaBlue-600" />
                <span>{t('కస్టమర్ ప్రొఫైల్ సవరణ (Edit Customer Profile)', 'Edit Customer Profile')}</span>
              </h3>
              <button
                onClick={() => setEditingCustomerProfile(null)}
                className="p-1 rounded-xl text-slateBase-400 hover:text-slateBase-700 hover:bg-white/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerProfile} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('కస్టమర్ పూర్తి పేరు (Full Name) *', 'Customer Full Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/80 border border-slateBase-200/80 rounded-xl text-xs font-bold text-slateBase-900 focus:outline-none focus:ring-2 focus:ring-saudaBlue-500/20 focus:border-saudaBlue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('ఫోన్ నంబర్ (Phone Number) *', 'Phone Number *')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slateBase-400 font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editCustPhone}
                    onChange={(e) => setEditCustPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-3 py-2 bg-white/80 border border-slateBase-200/80 rounded-xl text-xs font-bold font-mono text-slateBase-900 focus:outline-none focus:ring-2 focus:ring-saudaBlue-500/20 focus:border-saudaBlue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('ఊరు / వీధి / అడ్రస్ (Village / Address)', 'Village / Street / Address')}
                </label>
                <input
                  type="text"
                  value={editCustVillage}
                  onChange={(e) => setEditCustVillage(e.target.value)}
                  placeholder="Main Bazaar, Rampur"
                  className="w-full px-3 py-2 bg-white/80 border border-slateBase-200/80 rounded-xl text-xs font-medium text-slateBase-900 focus:outline-none focus:ring-2 focus:ring-saudaBlue-500/20 focus:border-saudaBlue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slateBase-700 mb-1">
                  {t('క్రెడిట్ పరిమితి (Credit Limit ₹)', 'Credit Limit (₹)')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slateBase-400 font-mono">₹</span>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={editCustLimit}
                    onChange={(e) => setEditCustLimit(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white/80 border border-slateBase-200/80 rounded-xl text-xs font-bold font-mono text-slateBase-900 focus:outline-none focus:ring-2 focus:ring-saudaBlue-500/20 focus:border-saudaBlue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slateBase-200/60 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCustomerProfile(null)}
                  className="px-4 py-2 border border-slateBase-300/80 rounded-xl text-xs font-bold text-slateBase-700 bg-white/60 hover:bg-white transition"
                >
                  {t('రద్దు చేయండి', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-saudaBlue-600 hover:bg-saudaBlue-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
                >
                  {t('ప్రొఫైల్ భద్రపరచు', 'Save Customer Profile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
