import React, { useState, useEffect } from 'react';
import { type Bill, type Shop, type PrinterConfig, type Customer } from '../types';
import { BarcodeSvg } from './BarcodeSvg';
import { generateUpiQrDataUrl } from '../utils/escpos';

interface ThermalReceiptProps {
  bill: Bill;
  shop?: Shop | null;
  config: PrinterConfig;
  customer?: Customer | null;
  savingsPaise?: number;
  isPrintContainer?: boolean;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  bill,
  shop,
  config,
  customer,
  savingsPaise = 0,
  isPrintContainer = false,
}) => {
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');

  const is80mm = config.paperWidth === '80MM';
  const widthClass = is80mm ? 'w-[320px]' : 'w-[250px]';

  // Format currency in Indian Rupees
  const formatRupees = (paise: number) => {
    return '₹' + (paise / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Generate UPI QR Code URL
  useEffect(() => {
    if (config.printUpiQrCode) {
      const vpa = `${shop?.phone || '9848022338'}@ybl`;
      const payee = shop?.name || 'Sauda Store';
      generateUpiQrDataUrl(vpa, payee, bill.totalPaise / 100, bill.billNumber).then((url) => {
        setUpiQrUrl(url);
      });
    }
  }, [bill.totalPaise, bill.billNumber, shop, config.printUpiQrCode]);

  return (
    <div
      id={isPrintContainer ? 'printable-receipt' : undefined}
      className={`${widthClass} bg-white text-black font-mono text-[11px] leading-tight select-none p-4 mx-auto border border-slateBase-300 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0`}
    >
      {/* 1. Header: Store Logo / Name */}
      <div className="text-center space-y-0.5">
        {bill.invoiceType === 'B2B' || bill.customerGstin ? (
          <div className="inline-block px-2 py-0.5 border border-black font-black text-[9px] uppercase tracking-wider mb-1">
            పన్ను ఇన్వాయిస్ / TAX INVOICE
          </div>
        ) : null}

        <div className="font-mono font-black text-sm sm:text-base tracking-tight uppercase leading-snug">
          {shop?.name || 'SRI LAKSHMI GENERAL STORE'}
        </div>
        
        {shop?.addressLine1 && (
          <div className="text-[10px] text-slate-800">
            {shop.addressLine1}
          </div>
        )}
        
        <div className="text-[10px] text-slate-800">
          {shop?.city && `${shop.city}`} {shop?.pincode && `- ${shop.pincode}`}
        </div>

        <div className="text-[10px] font-semibold text-slate-900">
          ఫోన్ (Ph): +91 {shop?.phone || '9848022338'}
        </div>

        {shop?.gstin && (
          <div className="text-[10px] font-bold text-slate-900 tracking-wider">
            GSTIN: {shop.gstin}
          </div>
        )}
      </div>

      {/* Dashed Divider */}
      <div className="border-t border-dashed border-black my-2" />

      {/* 2. Bill & Customer Metadata */}
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between font-bold">
          <span>బిల్లు నెం (Bill #): {bill.billNumber}</span>
          <span>{new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
        </div>
        <div className="flex justify-between text-slate-700">
          <span>క్యాషియర్: {bill.userId}</span>
          <span>{new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Customer / B2B Trade Info */}
        {(customer || bill.customerBusinessName || bill.customerGstin) && (
          <div className="pt-1 border-t border-dotted border-slate-300 mt-1 space-y-0.5">
            <div className="font-bold text-slate-950">
              కస్టమర్: {bill.customerBusinessName || customer?.fullName || 'Retail Customer'}
            </div>
            {bill.customerGstin && (
              <div className="font-mono font-bold text-[9px] text-slate-900">
                GSTIN: {bill.customerGstin}
              </div>
            )}
            {bill.placeOfSupply && (
              <div className="text-[9px] text-slate-700">
                Place of Supply: {bill.placeOfSupply}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dashed Divider */}
      <div className="border-t border-dashed border-black my-2" />

      {/* 3. Items Table Header */}
      <div className="font-bold text-[10px] uppercase pb-1 flex justify-between border-b border-black">
        <span className="flex-1 text-left">వస్తువు (ITEM)</span>
        <span className="w-10 text-center">పరిమాణం</span>
        {is80mm && <span className="w-14 text-right">ధర</span>}
        <span className="w-14 text-right">మొత్తం</span>
      </div>

      {/* Line Items */}
      <div className="divide-y divide-dashed divide-slate-200 text-[10.5px]">
        {bill.items.map((it, idx) => (
          <div key={idx} className="py-1">
            <div className="font-bold text-slate-950 truncate">
              {config.receiptLanguage === 'TELUGU_ONLY'
                ? it.productNameTe || it.productNameEn
                : config.receiptLanguage === 'ENGLISH_ONLY'
                ? it.productNameEn
                : `${it.productNameTe || it.productNameEn} (${it.variantName})`}
            </div>

            <div className="flex justify-between items-center text-slate-800 text-[10px] mt-0.5">
              <span className="flex-1 text-slate-500 font-mono text-[9px] flex items-center space-x-1">
                <span>{it.productNameEn}</span>
                {it.isFreeScheme && (
                  <span className="px-1 py-0.2 bg-black text-white font-bold text-[8px] rounded">
                    FREE
                  </span>
                )}
                {it.isReturn && (
                  <span className="px-1 py-0.2 bg-red-600 text-white font-bold text-[8px] rounded">
                    RETURN
                  </span>
                )}
              </span>
              <span className={`w-10 text-center font-bold ${it.isReturn ? 'text-red-600' : ''}`}>
                {it.isReturn ? `-${Math.abs(it.quantity)}` : `${it.quantity}x`}
              </span>
              {is80mm && (
                <span className="w-14 text-right font-medium">
                  {it.isFreeScheme ? '₹0.00' : formatRupees(it.unitPricePaise)}
                </span>
              )}
              <span className={`w-14 text-right font-bold ${it.isReturn ? 'text-red-600' : 'text-slate-950'}`}>
                {it.isFreeScheme ? '₹0.00' : (it.isReturn ? `-${formatRupees(Math.abs(it.lineTotalPaise))}` : formatRupees(it.lineTotalPaise))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Dashed Divider */}
      <div className="border-t border-dashed border-black my-2" />

      {/* 4. Financial Totals */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between text-slate-700">
          <span>ఉప మొత్తం (Subtotal):</span>
          <span className="font-bold">{formatRupees(bill.subtotalPaise)}</span>
        </div>

        {bill.discountPaise > 0 && (
          <div className="flex justify-between text-classicEmerald-700 font-bold">
            <span>డిస్కౌంట్ (Discount):</span>
            <span>-{formatRupees(bill.discountPaise)}</span>
          </div>
        )}

        {/* Savings Badge */}
        {config.printSavingsBadge && (savingsPaise > 0 || bill.discountPaise > 0) && (
          <div className="p-1.5 bg-slate-100 border border-dashed border-black text-center text-[10px] font-bold rounded my-1">
            మీరు ఆదా చేసిన మొత్తం: {formatRupees(savingsPaise || bill.discountPaise)}!
          </div>
        )}

        {/* Grand Total */}
        <div className="border-t-2 border-b-2 border-black py-1.5 flex justify-between items-baseline font-black">
          <span className="text-xs uppercase">నికర చెల్లింపు (TOTAL):</span>
          <span className="text-base font-extrabold">{formatRupees(bill.totalPaise)}</span>
        </div>

        {/* GST Tax Slabs Breakdown */}
        {(() => {
          const hasGst = (bill.cgstPaise || 0) + (bill.sgstPaise || 0) + (bill.igstPaise || 0) > 0;
          if (!hasGst && bill.invoiceType !== 'B2B') return null;

          return (
            <div className="pt-1.5 mt-1 border-t border-dotted border-black text-[9px] space-y-0.5">
              <div className="font-bold flex justify-between uppercase">
                <span>GST పన్ను విభజన (Tax Breakdown):</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>పన్ను విధించదగిన విలువ (Taxable):</span>
                <span>{formatRupees(bill.taxableAmountPaise || bill.totalPaise)}</span>
              </div>
              {(bill.cgstPaise || 0) > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>CGST:</span>
                  <span>{formatRupees(bill.cgstPaise || 0)}</span>
                </div>
              )}
              {(bill.sgstPaise || 0) > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>SGST:</span>
                  <span>{formatRupees(bill.sgstPaise || 0)}</span>
                </div>
              )}
              {(bill.igstPaise || 0) > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>IGST:</span>
                  <span>{formatRupees(bill.igstPaise || 0)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 border-t border-dotted border-slate-400 pt-0.5">
                <span>మొత్తం పన్ను (Total GST):</span>
                <span>{formatRupees((bill.cgstPaise || 0) + (bill.sgstPaise || 0) + (bill.igstPaise || 0))}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 5. Payment Details */}
      <div className="mt-2 text-[10px] space-y-0.5">
        <div className="flex justify-between font-bold">
          <span>చెల్లింపు పద్ధతి (Mode):</span>
          <span className="uppercase">{bill.paymentMethod}</span>
        </div>

        {bill.paymentMethod === 'CASH' && (
          <>
            <div className="flex justify-between text-slate-700">
              <span>అందుకున్న నగదు (Tendered):</span>
              <span>{formatRupees(bill.totalPaise)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>ఇచ్చిన చిల్లర (Change):</span>
              <span>₹0</span>
            </div>
          </>
        )}

        {bill.paymentMethod === 'SPLIT' && bill.splitPayments && (
          <div className="pt-1 mt-1 border-t border-dotted border-black space-y-0.5">
            <div className="font-bold text-[9px] uppercase">స్ప్లిట్ చెల్లింపు వివరాలు (Split Breakdown):</div>
            {bill.splitPayments.cashPaise > 0 && (
              <div className="flex justify-between text-slate-800">
                <span>నగదు (Cash):</span>
                <span className="font-bold">{formatRupees(bill.splitPayments.cashPaise)}</span>
              </div>
            )}
            {bill.splitPayments.upiPaise > 0 && (
              <div className="flex justify-between text-slate-800">
                <span>UPI ఆన్‌లైన్:</span>
                <span className="font-bold">{formatRupees(bill.splitPayments.upiPaise)}</span>
              </div>
            )}
            {bill.splitPayments.khataPaise > 0 && (
              <div className="flex justify-between text-amber-800">
                <span>ఖాతా బాకీ (Khata Due):</span>
                <span className="font-bold">{formatRupees(bill.splitPayments.khataPaise)}</span>
              </div>
            )}
          </div>
        )}

        {bill.paymentMethod === 'KHATA' && customer && config.printKhataBalance && (
          <div className="p-1.5 bg-amber-50 border border-amber-300 rounded text-center text-amber-950 font-bold mt-1">
            ఈ బిల్లు ఖాతాలో నమోదు చేయబడింది (Udhar)
          </div>
        )}
      </div>

      {/* 6. Dynamic UPI QR Code (if enabled) */}
      {config.printUpiQrCode && upiQrUrl && (
        <div className="mt-3 text-center flex flex-col items-center border-t border-dashed border-black pt-2">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-800 mb-1">
            స్కాన్ చేసి UPI ద్వారా చెల్లించండి (SCAN TO PAY)
          </div>
          <img
            src={upiQrUrl}
            alt="UPI QR Code"
            className="w-24 h-24 border border-black p-1 bg-white"
          />
          <div className="text-[8px] font-mono font-bold mt-0.5 text-slate-600">
            UPI: {shop?.phone || '9848022338'}@ybl
          </div>
        </div>
      )}

      {/* 7. Invoice Barcode for Return / Counter Lookup (if enabled) */}
      {config.printInvoiceBarcode && (
        <div className="mt-2 pt-2 border-t border-dashed border-black flex flex-col items-center">
          <BarcodeSvg
            value={bill.billNumber}
            format="CODE128"
            width={is80mm ? 1.2 : 0.9}
            height={24}
            fontSize={9}
            displayValue={true}
          />
        </div>
      )}

      {/* 8. Footer Message */}
      <div className="mt-2 pt-2 border-t border-dashed border-black text-center text-[9px] text-slate-700 space-y-0.5">
        {config.customFooterMessage && (
          <div className="font-bold text-slate-900">{config.customFooterMessage}</div>
        )}
        <div className="font-bold">ధన్యవాదాలు! మరల రండి • Thank You! Visit Again</div>
        <div className="text-[8px] text-slate-500 font-sans mt-0.5">
          Powered by Sauda (సౌదా) Kirana OS
        </div>
      </div>
    </div>
  );
};
