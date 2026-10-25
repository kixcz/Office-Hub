import React, { useState, useMemo, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Printer,
    Download,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Minimize2,
    Plus,
    Trash2,
    RotateCcw,
    BookmarkCheck,
    CheckCircle2,
    Table,
    FileSpreadsheet,
    FileText,
    Building2,
    SlidersHorizontal,
    Layers,
    Check,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type InventoryItem } from './index';

export interface SignatoryItem {
    id: string;
    label: string;
    name: string;
    designation: string;
    department: string;
    showSignatureLine: boolean;
}

interface LabInventoryReportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: InventoryItem[];
    rooms: Array<{ id: number; room_name: string; type?: string; custom_type?: string; building?: string }>;
    categories: string[];
}

export default function LabInventoryReportModal({
    open,
    onOpenChange,
    items = [],
    rooms = [],
    categories = [],
}: LabInventoryReportModalProps) {
    // 1. Report Filters & Scope
    const [selectedFacility, setSelectedFacility] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedCondition, setSelectedCondition] = useState<string>('all');
    const [selectedTrackingType, setSelectedTrackingType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'facility' | 'name' | 'value' | 'condition'>('facility');

    // 2. Report Summaries & Metrics toggles
    const [keySummaries, setKeySummaries] = useState({
        executiveSummary: true,
        assetTotals: true,
        conditionBreakdown: true,
        valuationSummary: true,
        facilityBreakdown: true,
    });

    // 3. Dynamic Signatories
    const getDefaultSignatories = (): SignatoryItem[] => [
        {
            id: 'sig-1',
            label: 'Prepared by',
            name: 'Engr. Laboratory Custodian',
            designation: 'Laboratory In-Charge & Property Custodian',
            department: 'College of Information and Computing Studies',
            showSignatureLine: true,
        },
        {
            id: 'sig-2',
            label: 'Verified by',
            name: 'Prof. Computer Laboratories Coordinator',
            designation: 'Laboratories & Facilities Coordinator',
            department: 'College of Information and Computing Studies',
            showSignatureLine: true,
        },
        {
            id: 'sig-3',
            label: 'Approved by',
            name: 'Dr. Ramon Santos, PECE',
            designation: 'Dean, College of Information and Computing Studies',
            department: 'Davao del Sur State College',
            showSignatureLine: true,
        },
    ];

    const [signatoriesList, setSignatoriesList] = useState<SignatoryItem[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('cids_lab_inventory_report_signatories');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {
                console.warn('Could not read saved lab inventory signatories:', e);
            }
        }
        return getDefaultSignatories();
    });

    const persistSignatories = (updated: SignatoryItem[]) => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('cids_lab_inventory_report_signatories', JSON.stringify(updated));
            }
        } catch (e) {
            console.warn('Failed to save signatories to localStorage:', e);
        }
    };

    const handleAddSignatory = () => {
        const newSig: SignatoryItem = {
            id: `sig-${Date.now()}`,
            label: 'Noted by',
            name: 'Campus Property Custodian',
            designation: 'Supply & Property Management Officer',
            department: 'Administrative Services Division',
            showSignatureLine: true,
        };
        const updated = [...signatoriesList, newSig];
        setSignatoriesList(updated);
        persistSignatories(updated);
    };

    const handleRemoveSignatory = (id: string) => {
        if (signatoriesList.length <= 1) return;
        const updated = signatoriesList.filter((s) => s.id !== id);
        setSignatoriesList(updated);
        persistSignatories(updated);
    };

    const handleUpdateSignatory = (id: string, field: keyof SignatoryItem, value: any) => {
        const updated = signatoriesList.map((s) => (s.id === id ? { ...s, [field]: value } : s));
        setSignatoriesList(updated);
        persistSignatories(updated);
    };

    const handleResetSignatories = () => {
        const defaults = getDefaultSignatories();
        setSignatoriesList(defaults);
        persistSignatories(defaults);
        showToast('Signatories reset to default institutional template.');
    };

    // 4. Excluded items from report
    const [excludedItemIds, setExcludedItemIds] = useState<number[]>([]);

    const handleExcludeItem = (id: number, name: string) => {
        setExcludedItemIds((prev) => [...prev, id]);
        showToast(`Excluded "${name}" from report.`);
    };

    const handleRestoreItem = (id: number) => {
        setExcludedItemIds((prev) => prev.filter((i) => i !== id));
    };

    const handleRestoreAll = () => {
        setExcludedItemIds([]);
        showToast('Restored all excluded assets.');
    };

    // 5. Toast Feedback
    const [actionNotification, setActionNotification] = useState<string | null>(null);
    const showToast = (msg: string) => {
        setActionNotification(msg);
        setTimeout(() => setActionNotification(null), 3000);
    };

    // 6. Zoom & Fullscreen
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [isMaximized, setIsMaximized] = useState<boolean>(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    // Filtered data for the report matrix
    const reportData = useMemo(() => {
        let list = [...items];

        if (selectedFacility !== 'all') {
            list = list.filter((item) => String(item.room_id) === selectedFacility);
        }

        if (selectedCategory !== 'all') {
            list = list.filter((item) => item.category === selectedCategory);
        }

        if (selectedCondition !== 'all') {
            list = list.filter((item) => item.condition === selectedCondition);
        }

        if (selectedTrackingType !== 'all') {
            list = list.filter((item) => item.tracking_type === selectedTrackingType);
        }

        // Filter out excluded items
        const excludedList = list.filter((i) => excludedItemIds.includes(i.id));
        const activeRows = list.filter((i) => !excludedItemIds.includes(i.id));

        // Sort rows
        activeRows.sort((a, b) => {
            if (sortBy === 'facility') {
                const facCompare = (a.room_name || '').localeCompare(b.room_name || '');
                if (facCompare !== 0) return facCompare;
                return (a.item_name || '').localeCompare(b.item_name || '');
            }
            if (sortBy === 'name') {
                return (a.item_name || '').localeCompare(b.item_name || '');
            }
            if (sortBy === 'value') {
                const valA = (a.quantity || 1) * (Number(a.unit_cost) || 0);
                const valB = (b.quantity || 1) * (Number(b.unit_cost) || 0);
                return valB - valA;
            }
            if (sortBy === 'condition') {
                return (a.condition || '').localeCompare(b.condition || '');
            }
            return 0;
        });

        // Compute metrics
        const totalItemsCount = activeRows.length;
        const totalQuantity = activeRows.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
        const totalValuation = activeRows.reduce((sum, i) => sum + ((Number(i.quantity) || 1) * (Number(i.unit_cost) || 0)), 0);

        const operationalCount = activeRows.filter((i) => i.condition === 'Operational').length;
        const minorIssueCount = activeRows.filter((i) => i.condition === 'Operational with Minor Issue').length;
        const forRepairCount = activeRows.filter((i) => i.condition === 'For Repair' || i.condition === 'Under Maintenance').length;
        const damagedCount = activeRows.filter((i) => i.condition === 'Damaged').length;
        const missingCount = activeRows.filter((i) => i.condition === 'Missing').length;
        const consumablesCount = activeRows.filter((i) => i.tracking_type === 'consumable').length;

        // Facility groups count
        const facilityMap = new Map<string, number>();
        activeRows.forEach((i) => {
            const fac = i.room_name || 'Unassigned Room';
            facilityMap.set(fac, (facilityMap.get(fac) || 0) + (Number(i.quantity) || 1));
        });

        return {
            rows: activeRows,
            excludedList,
            totals: {
                totalItemsCount,
                totalQuantity,
                totalValuation,
                operationalCount,
                minorIssueCount,
                forRepairCount,
                damagedCount,
                missingCount,
                consumablesCount,
                facilityCount: facilityMap.size,
            },
        };
    }, [items, selectedFacility, selectedCategory, selectedCondition, selectedTrackingType, sortBy, excludedItemIds]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(val || 0);
    };

    // Isolated Print Preview via hidden iframe
    const handlePrintPreview = () => {
        const sheetElement = document.getElementById('inventory-report-preview-sheet');
        if (!sheetElement) {
            window.print();
            return;
        }

        let printIframe = document.getElementById('inventory-report-print-iframe') as HTMLIFrameElement | null;
        if (!printIframe) {
            printIframe = document.createElement('iframe');
            printIframe.id = 'inventory-report-print-iframe';
            printIframe.style.position = 'fixed';
            printIframe.style.right = '0';
            printIframe.style.bottom = '0';
            printIframe.style.width = '0';
            printIframe.style.height = '0';
            printIframe.style.border = 'none';
            document.body.appendChild(printIframe);
        }

        const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
        if (!iframeDoc) {
            window.print();
            return;
        }

        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map((el) => el.outerHTML)
            .join('\n');

        const clonedSheet = sheetElement.cloneNode(true) as HTMLElement;
        clonedSheet.style.transform = 'none';
        clonedSheet.style.boxShadow = 'none';
        clonedSheet.style.border = 'none';
        clonedSheet.style.margin = '0 auto';
        clonedSheet.style.padding = '0';
        clonedSheet.style.width = '100%';
        clonedSheet.style.maxWidth = '100%';

        clonedSheet.querySelectorAll('.no-print, .no-pdf').forEach((el) => el.remove());
        clonedSheet.querySelectorAll('.overflow-x-auto, .overflow-hidden').forEach((el) => {
            (el as HTMLElement).style.overflow = 'visible';
            (el as HTMLElement).style.width = '100%';
        });

        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Laboratory Inventory & Accountability Report</title>
                ${styles}
                <style>
                    @page {
                        size: A3 landscape;
                        margin: 12mm;
                    }
                    html, body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                    }
                    * {
                        box-shadow: none !important;
                        text-shadow: none !important;
                        scrollbar-width: none !important;
                    }
                    #inventory-report-preview-sheet {
                        border: none !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        page-break-inside: auto !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    thead {
                        display: table-header-group !important;
                    }
                    .page-break-inside-avoid {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                </style>
            </head>
            <body>
                <div style="width: 100%;">
                    ${clonedSheet.outerHTML}
                </div>
            </body>
            </html>
        `);
        iframeDoc.close();

        setTimeout(() => {
            try {
                printIframe?.contentWindow?.focus();
                printIframe?.contentWindow?.print();
            } catch (e) {
                console.error('Print iframe error:', e);
                window.print();
            }
        }, 350);
    };

    // Client-side PDF Generation with jsPDF & autotable
    const handleGeneratePdf = async () => {
        if (isGeneratingPdf) return;
        setIsGeneratingPdf(true);

        const facilityName = selectedFacility === 'all'
            ? 'ALL_LABS'
            : (rooms.find((r) => String(r.id) === selectedFacility)?.room_name.replace(/\s+/g, '_') || 'LAB');
        const fileName = `DSSC_CIDS_Laboratory_Inventory_Matrix_${facilityName}_${new Date().toISOString().slice(0, 10)}.pdf`;

        try {
            const { jsPDF } = await import('jspdf');
            const autoTableModule = await import('jspdf-autotable');
            const autoTable = (autoTableModule as any).default || autoTableModule;

            // 1. Configure Document: A3 Landscape (420mm x 297mm) with 12mm margins
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a3',
                compress: true,
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 12.0;
            let currentY = margin;

            // Load CIDS Logo as Data URL
            let logoDataUrl: string | null = null;
            try {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = '/CIDS_Logo.jpg';
                await new Promise((resolve) => {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                });
                if (img.width && img.height) {
                    const tempCanvas = document.createElement('canvas');
                    const size = Math.min(img.width, img.height);
                    tempCanvas.width = size;
                    tempCanvas.height = size;
                    const ctx = tempCanvas.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, size, size);
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
                        ctx.closePath();
                        ctx.clip();
                        const offsetX = (img.width - size) / 2;
                        const offsetY = (img.height - size) / 2;
                        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
                        ctx.restore();
                        logoDataUrl = tempCanvas.toDataURL('image/png');
                    }
                }
            } catch (err) {
                console.warn('Could not load logo for PDF header:', err);
            }

            // Render Official DSSC Header
            const renderDocHeader = (yPos: number) => {
                let y = yPos;
                if (logoDataUrl) {
                    const logoSize = 18;
                    const logoX = (pageWidth - logoSize) / 2;
                    doc.addImage(logoDataUrl, 'PNG', logoX, y, logoSize, logoSize);
                    y += logoSize + 2;
                }

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                doc.setTextColor(80, 80, 80);
                doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, y, { align: 'center' });
                y += 4;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(13);
                doc.setTextColor(15, 23, 42);
                doc.text('DAVAO DEL SUR STATE COLLEGE', pageWidth / 2, y, { align: 'center' });
                y += 5;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(30, 41, 59);
                doc.text('COLLEGE OF INFORMATION AND COMPUTING STUDIES', pageWidth / 2, y, { align: 'center' });
                y += 4;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text('Brgy. Matti, Digos City, Davao del Sur', pageWidth / 2, y, { align: 'center' });
                y += 6;

                // Official Report Title Banner Box
                doc.setDrawColor(203, 213, 225);
                doc.setFillColor(248, 250, 252);
                doc.roundedRect(margin, y, pageWidth - (margin * 2), 16, 1.5, 1.5, 'FD');

                const selectedRoomLabel = selectedFacility === 'all'
                    ? 'ALL FACILITIES & COMPUTER LABORATORIES'
                    : (rooms.find((r) => String(r.id) === selectedFacility)?.room_name.toUpperCase() || 'SPECIFIC FACILITY');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(15, 23, 42);
                doc.text('LABORATORY INVENTORY & PHYSICAL ASSET ACCOUNTABILITY MATRIX', pageWidth / 2, y + 5.5, { align: 'center' });

                const subTitleStr = `Scope: ${selectedRoomLabel}   ·   Category: ${selectedCategory === 'all' ? 'All Asset Categories' : selectedCategory}   ·   Condition: ${selectedCondition === 'all' ? 'All Operational Conditions' : selectedCondition}`;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(51, 65, 85);
                doc.text(subTitleStr, pageWidth / 2, y + 10, { align: 'center' });

                const metaStr = `Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}   |   Document Ref: DSSC-CIDS-INV-${new Date().getFullYear()}   |   Asset Registry: Verified Operational Database   |   Baseline: Physical Count`;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139);
                doc.text(metaStr, pageWidth / 2, y + 14, { align: 'center' });

                return y + 20;
            };

            currentY = renderDocHeader(currentY);

            // 2. Render Key Summaries Table
            if (keySummaries.assetTotals && reportData.totals) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(15, 23, 42);
                doc.text('KEY SUMMARIES & ASSET VALUATION BREAKDOWN', margin, currentY);
                currentY += 2;

                const summaryHead = [
                    [
                        'TOTAL ASSETS',
                        'TOTAL PIECES / QTY',
                        'OPERATIONAL',
                        'WITH MINOR ISSUE',
                        'FOR REPAIR',
                        'DAMAGED',
                        'MISSING',
                        'CONSUMABLES',
                        'LABS COVERED',
                        'TOTAL ESTIMATED VALUATION (PHP)',
                    ],
                ];

                const summaryBody = [
                    [
                        String(reportData.totals.totalItemsCount),
                        String(reportData.totals.totalQuantity),
                        String(reportData.totals.operationalCount),
                        String(reportData.totals.minorIssueCount),
                        String(reportData.totals.forRepairCount),
                        String(reportData.totals.damagedCount),
                        String(reportData.totals.missingCount),
                        String(reportData.totals.consumablesCount),
                        String(reportData.totals.facilityCount),
                        formatCurrency(reportData.totals.totalValuation),
                    ],
                ];

                autoTable(doc, {
                    startY: currentY,
                    head: summaryHead,
                    body: summaryBody,
                    margin: { left: margin, right: margin },
                    theme: 'grid',
                    styles: {
                        font: 'helvetica',
                        fontSize: 7.5,
                        cellPadding: 2,
                        halign: 'center',
                        valign: 'middle',
                        textColor: [15, 23, 42],
                        lineColor: [203, 213, 225],
                        lineWidth: 0.2,
                    },
                    headStyles: {
                        fillColor: [241, 245, 249],
                        textColor: [15, 23, 42],
                        fontStyle: 'bold',
                        fontSize: 7.5,
                    },
                    alternateRowStyles: {
                        fillColor: [255, 255, 255],
                    },
                });

                currentY = (doc as any).lastAutoTable.finalY + 6;
            }

            // 3. Render Main Detailed Inventory Matrix Table
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(15, 23, 42);
            doc.text('OFFICIAL LABORATORY ASSET & EQUIPMENT MATRIX', margin, currentY);
            currentY += 2;

            const mainHead = [
                [
                    '#',
                    'ASSET CODE',
                    'ITEM NAME & SPECIFICATIONS',
                    'CATEGORY',
                    'LOCATION / LAB',
                    'SERIAL NUMBER',
                    'CONDITION',
                    'QTY',
                    'UNIT COST',
                    'TOTAL VALUE',
                    'CUSTODIAN',
                    'REMARKS',
                ],
            ];

            const mainRows = reportData.rows.map((row, idx) => {
                const itemSpecs = row.brand_model
                    ? `${row.item_name}\n(${row.brand_model})`
                    : row.item_name;
                const cost = Number(row.unit_cost) || 0;
                const qty = Number(row.quantity) || 1;
                const totalCost = cost * qty;

                return [
                    String(idx + 1),
                    row.asset_number || '—',
                    itemSpecs,
                    row.category || '—',
                    row.room_name || '—',
                    row.serial_number || '—',
                    row.condition,
                    `${qty} ${row.unit || 'unit'}`,
                    cost > 0 ? formatCurrency(cost) : '—',
                    totalCost > 0 ? formatCurrency(totalCost) : '—',
                    row.custodian || 'Head Lab Custodian',
                    row.remarks || 'Operational',
                ];
            });

            autoTable(doc, {
                startY: currentY,
                head: mainHead,
                body: mainRows,
                margin: { left: margin, right: margin, bottom: 20 },
                theme: 'grid',
                rowPageBreak: 'avoid',
                showHead: 'everyPage',
                styles: {
                    font: 'helvetica',
                    fontSize: 7.5,
                    cellPadding: 2,
                    valign: 'middle',
                    lineColor: [203, 213, 225],
                    lineWidth: 0.2,
                    textColor: [15, 23, 42],
                    overflow: 'linebreak',
                },
                headStyles: {
                    fillColor: [241, 245, 249],
                    textColor: [15, 23, 42],
                    fontStyle: 'bold',
                    fontSize: 7.5,
                    halign: 'center',
                    valign: 'middle',
                },
                columnStyles: {
                    0: { cellWidth: 8, halign: 'center' },       // #
                    1: { cellWidth: 26, halign: 'center', fontStyle: 'bold' }, // Asset Code
                    2: { cellWidth: 64, halign: 'left' },        // Item Name & Spec
                    3: { cellWidth: 32, halign: 'left' },        // Category
                    4: { cellWidth: 26, halign: 'center' },      // Location / Lab
                    5: { cellWidth: 32, halign: 'center' },      // Serial
                    6: { cellWidth: 26, halign: 'center', fontStyle: 'bold' }, // Condition
                    7: { cellWidth: 16, halign: 'center' },      // Qty
                    8: { cellWidth: 26, halign: 'right' },       // Unit Cost
                    9: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }, // Total Value
                    10: { cellWidth: 42, halign: 'left' },       // Custodian
                    11: { cellWidth: 36, halign: 'left' },       // Remarks
                },
                alternateRowStyles: {
                    fillColor: [255, 255, 255],
                },
            });

            currentY = (doc as any).lastAutoTable.finalY + 4;

            // 4. Monochrome Legend / Verification Note Box
            const legendBlockHeight = 18;
            if (currentY + legendBlockHeight + 35 > pageHeight - margin) {
                doc.addPage();
                currentY = margin + 5;
            }

            const legendWidth = pageWidth - (margin * 2);
            doc.setDrawColor(15, 23, 42);
            doc.setLineWidth(0.2);
            doc.rect(margin, currentY, legendWidth, 16);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(15, 23, 42);
            doc.text('INVENTORY CONDITION DEFINITIONS & VERIFICATION PROTOCOL:', margin + 3, currentY + 4.5);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.text(
                '[ Operational: Fully functional with all accessories ]   [ Minor Issue: Usable with reported non-critical cosmetic/software defect ]   [ For Repair: Non-functional or flagged for maintenance ]   [ Damaged / Missing: Subject to property write-off or investigation ]',
                margin + 3,
                currentY + 9
            );

            doc.setFont('helvetica', 'italic');
            doc.setFontSize(6.5);
            doc.setTextColor(70, 70, 70);
            doc.text(
                'Note: This matrix constitutes an official academic and institutional property accountability record of the College of Information and Computing Studies (CIDS).',
                margin + 3,
                currentY + 13
            );

            currentY += 20;

            // 5. Signatories Section
            const requiredSignatoryHeight = 35;
            if (currentY + requiredSignatoryHeight > pageHeight - 20) {
                doc.addPage();
                currentY = margin + 5;
            }

            const sigCols = 3;
            const sigWidth = (pageWidth - (margin * 2) - ((sigCols - 1) * 15)) / sigCols;

            signatoriesList.forEach((sig, index) => {
                const col = index % sigCols;
                const row = Math.floor(index / sigCols);
                const x = margin + (col * (sigWidth + 15));
                const y = currentY + (row * 30);

                if (y + 25 > pageHeight - 20) {
                    doc.addPage();
                    currentY = margin + 5;
                }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(30, 41, 59);
                doc.text(`${sig.label}:`, x, y);

                const lineY = y + 14;
                if (sig.showSignatureLine) {
                    doc.setDrawColor(30, 41, 59);
                    doc.setLineWidth(0.3);
                    doc.line(x, lineY, x + sigWidth - 5, lineY);
                }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(15, 23, 42);
                doc.text((sig.name || '').toUpperCase(), x, lineY - 1);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(71, 85, 105);
                doc.text(sig.designation || '', x, lineY + 3.5);

                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139);
                doc.text(sig.department || '', x, lineY + 7);
            });

            // 6. Running Footers with Page Numbering across all pages
            const totalPages = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.2);
                doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(100, 116, 139);

                doc.text(
                    `OfficeHub CIDS Laboratory Inventory Matrix · ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} · Official Document`,
                    margin,
                    pageHeight - 7
                );

                doc.text(
                    `Page ${i} of ${totalPages}`,
                    pageWidth - margin,
                    pageHeight - 7,
                    { align: 'right' }
                );
            }

            doc.save(fileName);
            showToast('PDF exported successfully in A3 Landscape format!');
        } catch (error) {
            console.error('PDF generation error:', error);
            showToast('Direct PDF export encountered an issue, opening print preview...');
            handlePrintPreview();
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "p-0 gap-0 overflow-hidden max-w-full transition-all duration-300 max-h-[96vh] flex flex-col bg-slate-100 dark:bg-slate-950",
                isMaximized ? "w-[98vw] h-[96vh]" : "w-[94vw] lg:w-[1300px] h-[92vh]"
            )}>
                {/* Floating Notification */}
                {actionNotification && (
                    <div className="fixed top-6 right-8 z-50 bg-slate-900 text-amber-400 border border-amber-400/50 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{actionNotification}</span>
                    </div>
                )}

                {/* MODAL HEADER */}
                <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs ring-2 ring-amber-400/30">
                            <FileSpreadsheet className="w-5 h-5 stroke-[2.4]" />
                        </div>
                        <div>
                            <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span>Generate Laboratory Inventory Report</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    Official Matrix
                                </span>
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                                Institutional accountability report matrix with dynamic signatories, summary valuations, and PDF export.
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        >
                            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline ml-1.5">{isMaximized ? 'Restore' : 'Maximize'}</span>
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* MODAL BODY: 2 COLUMNS (Configuration Panel on Left, Live Paper Sheet on Right) */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                    {/* LEFT CONFIGURATION PANEL (lg:col-span-4) */}
                    <div className="lg:col-span-4 overflow-y-auto p-4 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 space-y-4">
                        {/* STEP 1: REPORT SCOPE & FILTERS */}
                        <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                                    1
                                </span>
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Report Filter Scope
                                </h3>
                            </div>

                            <div className="space-y-2.5 text-xs">
                                <div>
                                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                        Assigned Facility / Laboratory:
                                    </label>
                                    <select
                                        value={selectedFacility}
                                        onChange={(e) => setSelectedFacility(e.target.value)}
                                        className="w-full h-8.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    >
                                        <option value="all">All Facilities ({rooms.length} Labs)</option>
                                        {rooms.map((r) => (
                                            <option key={r.id} value={String(r.id)}>
                                                {r.room_name} ({r.building || 'CIDS'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                            Category:
                                        </label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full h-8.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        >
                                            <option value="all">All Categories</option>
                                            {categories.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                            Condition:
                                        </label>
                                        <select
                                            value={selectedCondition}
                                            onChange={(e) => setSelectedCondition(e.target.value)}
                                            className="w-full h-8.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        >
                                            <option value="all">All Conditions</option>
                                            <option value="Operational">Operational</option>
                                            <option value="Operational with Minor Issue">Minor Issue</option>
                                            <option value="For Repair">For Repair</option>
                                            <option value="Under Maintenance">Under Maintenance</option>
                                            <option value="Damaged">Damaged</option>
                                            <option value="Missing">Missing</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                            Asset Type:
                                        </label>
                                        <select
                                            value={selectedTrackingType}
                                            onChange={(e) => setSelectedTrackingType(e.target.value)}
                                            className="w-full h-8.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        >
                                            <option value="all">All Types</option>
                                            <option value="serialized">Serialized Asset</option>
                                            <option value="non_serialized">Non-Serialized</option>
                                            <option value="consumable">Consumable Stock</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                                            Sort By:
                                        </label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="w-full h-8.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        >
                                            <option value="facility">Laboratory & Name</option>
                                            <option value="name">Item Name (A–Z)</option>
                                            <option value="value">Total Value (Highest)</option>
                                            <option value="condition">Condition Status</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* STEP 2: SUMMARY METRICS PREVIEW TABLE */}
                        <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                                    2
                                </span>
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Inventory Summary Totals
                                </h3>
                            </div>

                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                <table className="w-full text-[11px] text-left border-collapse">
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                                            <td className="py-1 px-2.5 text-slate-500 font-medium">Assets in Scope</td>
                                            <td className="py-1 px-2.5 text-right font-black text-slate-900 dark:text-white">
                                                {reportData.totals.totalItemsCount} items ({reportData.totals.totalQuantity} units)
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-1 px-2.5 text-slate-500 font-medium">Operational</td>
                                            <td className="py-1 px-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                {reportData.totals.operationalCount}
                                            </td>
                                        </tr>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                                            <td className="py-1 px-2.5 text-slate-500 font-medium">Minor Issue / Repair</td>
                                            <td className="py-1 px-2.5 text-right font-bold text-amber-600 dark:text-amber-400">
                                                {reportData.totals.minorIssueCount + reportData.totals.forRepairCount}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-1 px-2.5 text-slate-500 font-medium">Damaged / Missing</td>
                                            <td className="py-1 px-2.5 text-right font-bold text-rose-600 dark:text-rose-400">
                                                {reportData.totals.damagedCount + reportData.totals.missingCount}
                                            </td>
                                        </tr>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/40">
                                            <td className="py-1 px-2.5 text-slate-500 font-medium">Total Valuation</td>
                                            <td className="py-1 px-2.5 text-right font-bold font-mono text-slate-900 dark:text-white">
                                                {formatCurrency(reportData.totals.totalValuation)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* STEP 3: DYNAMIC SIGNATORIES */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs">
                                        3
                                    </span>
                                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                        Dynamic Signatories
                                    </h3>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={handleResetSignatories}
                                        className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                                        title="Reset signatories"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Reset</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddSignatory}
                                        className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center gap-1 cursor-pointer shadow-xs"
                                    >
                                        <Plus className="w-3 h-3 stroke-[2.5]" />
                                        <span>Add</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                {signatoriesList.map((sig, idx) => (
                                    <div
                                        key={sig.id}
                                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 hover:border-amber-400/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                                                <input
                                                    type="text"
                                                    value={sig.label}
                                                    onChange={(e) => handleUpdateSignatory(sig.id, 'label', e.target.value)}
                                                    className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:outline-none w-28 focus:border-amber-500"
                                                />
                                            </div>
                                            {signatoriesList.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSignatory(sig.id)}
                                                    className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                                                    title="Remove Signatory"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 text-xs">
                                            <input
                                                type="text"
                                                placeholder="Signatory Full Name"
                                                value={sig.name}
                                                onChange={(e) => handleUpdateSignatory(sig.id, 'name', e.target.value)}
                                                className="w-full h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Designation / Official Title"
                                                value={sig.designation}
                                                onChange={(e) => handleUpdateSignatory(sig.id, 'designation', e.target.value)}
                                                className="w-full h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-400"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Department / Division"
                                                value={sig.department}
                                                onChange={(e) => handleUpdateSignatory(sig.id, 'department', e.target.value)}
                                                className="w-full h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-500 dark:text-slate-400 focus:outline-none focus:border-amber-400"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                                            <span>Signature line underline</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={sig.showSignatureLine}
                                                    onChange={(e) => handleUpdateSignatory(sig.id, 'showSignatureLine', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-6 h-3.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-400 dark:peer-checked:bg-amber-400"></div>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* BOTTOM ACTION BUTTONS */}
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handlePrintPreview}
                                    className="flex-1 h-9 text-xs font-bold rounded-xl border-amber-400/50 bg-amber-400/10 hover:bg-amber-400/20 text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print Preview</span>
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleGeneratePdf}
                                    disabled={isGeneratingPdf}
                                    className="flex-1 h-9 text-xs font-black rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-70"
                                >
                                    <Download className={cn("w-3.5 h-3.5 stroke-[2.5]", isGeneratingPdf && "animate-bounce")} />
                                    <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PREVIEW CANVAS: LIVE SHEET (lg:col-span-8) */}
                    <div className="lg:col-span-8 flex flex-col items-center bg-slate-200/70 dark:bg-slate-950/80 overflow-y-auto p-4">
                        {/* Control Toolbar */}
                        <div className="w-full max-w-[1100px] h-10 bg-slate-900 text-slate-200 rounded-t-xl px-4 flex items-center justify-between text-xs font-semibold shadow-md border-b border-slate-800 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Live Preview (A3 Landscape)
                                </span>
                                <span className="text-slate-400 text-[11px]">
                                    {reportData.rows.length} asset entries
                                </span>
                            </div>

                            {/* Zoom controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel(Math.max(60, zoomLevel - 10))}
                                    className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-mono text-xs w-10 text-center text-slate-300">
                                    {zoomLevel}%
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel(Math.min(140, zoomLevel + 10))}
                                    className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleGeneratePdf}
                                    className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Download PDF"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePrintPreview}
                                    className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                                    title="Print"
                                >
                                    <Printer className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Paper Sheet Preview Area */}
                        <div
                            ref={previewContainerRef}
                            className="w-full max-w-[1100px] overflow-x-auto flex justify-center py-4 bg-slate-300/40 dark:bg-slate-900/40 rounded-b-xl border border-slate-300 dark:border-slate-800 border-t-0"
                        >
                            <div
                                id="inventory-report-preview-sheet"
                                className="w-full max-w-[1050px] min-h-[750px] bg-white text-slate-900 border border-slate-300 shadow-xl p-[0.35in] transition-transform origin-top flex flex-col justify-between box-border"
                                style={{ transform: `scale(${zoomLevel / 100})` }}
                            >
                                <div className="space-y-4">
                                    {/* 1. OFFICIAL DSSC LETTERHEAD */}
                                    <div className="flex flex-col items-center justify-center text-center pb-2 space-y-2">
                                        <img
                                            src="/CIDS_Logo.jpg"
                                            alt="CIDS Logo"
                                            className="w-16 h-16 object-contain rounded-full bg-white p-0.5 shadow-2xs"
                                        />
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] tracking-wider text-slate-600 uppercase font-semibold">
                                                REPUBLIC OF THE PHILIPPINES
                                            </p>
                                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                                DAVAO DEL SUR STATE COLLEGE
                                            </h2>
                                            <p className="text-[10.5px] font-bold text-slate-700">
                                                College of Information and Computing Studies
                                            </p>
                                            <p className="text-[9.5px] text-slate-500 font-medium">
                                                Brgy. Matti, Digos City, Davao del Sur
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. REPORT TITLE BANNER (Monochrome Professional Header) */}
                                    <div className="bg-slate-50 border border-slate-300 py-2.5 px-3 text-center rounded-xs space-y-1">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                            LABORATORY INVENTORY & PHYSICAL ASSET ACCOUNTABILITY MATRIX
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-800">
                                            {selectedFacility === 'all' ? 'All Facilities & Computer Laboratories' : rooms.find((r) => String(r.id) === selectedFacility)?.room_name} · {selectedCategory === 'all' ? 'All Categories' : selectedCategory} · {selectedCondition === 'all' ? 'All Conditions' : selectedCondition}
                                        </p>
                                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[8.5px] text-slate-600 font-medium border-t border-slate-200 pt-1.5 mt-1">
                                            <span>Generated: <strong className="text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</strong></span>
                                            <span>·</span>
                                            <span>Document Code: <strong className="text-slate-900">DSSC-CIDS-INV-{new Date().getFullYear()}</strong></span>
                                            <span>·</span>
                                            <span>Registry: <strong className="text-slate-900">Verified Equipment Records</strong></span>
                                            <span>·</span>
                                            <span>Baseline: <strong className="text-slate-900">Physical Asset Count</strong></span>
                                        </div>
                                    </div>

                                    {/* 3. KEY SUMMARIES (PROFESSIONAL TABLE VIEW - MONOCHROME) */}
                                    {keySummaries.assetTotals && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs uppercase tracking-wider">
                                                <span>KEY SUMMARIES & ASSET VALUATION BREAKDOWN</span>
                                            </div>

                                            <div className="border border-slate-300 rounded overflow-hidden">
                                                <table className="w-full text-[9px] text-center border-collapse font-sans">
                                                    <thead>
                                                        <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900 uppercase">
                                                            <th className="py-2 px-1 border-r border-slate-300">TOTAL ASSETS</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">TOTAL QUANTITY</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">OPERATIONAL</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">MINOR ISSUE</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">FOR REPAIR</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">DAMAGED</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">MISSING</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">CONSUMABLES</th>
                                                            <th className="py-2 px-1 border-r border-slate-300">LABS COVERED</th>
                                                            <th className="py-2 px-1">TOTAL VALUATION (PHP)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200">
                                                        <tr className="bg-white font-mono text-[9px]">
                                                            <td className="py-2 px-1.5 border-r border-slate-300 font-bold text-slate-900 text-[11px]">
                                                                {reportData.totals.totalItemsCount}
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {reportData.totals.totalQuantity}
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {reportData.totals.operationalCount}
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {reportData.totals.minorIssueCount}
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {reportData.totals.forRepairCount}
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {reportData.totals.damagedCount}
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {reportData.totals.missingCount}
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {reportData.totals.consumablesCount}
                                                            </td>
                                                            <td className="py-2 px-1 border-r border-slate-300 font-bold text-slate-900">
                                                                {reportData.totals.facilityCount}
                                                            </td>
                                                            <td className="py-2 px-1 font-bold font-mono text-slate-900 text-[10px]">
                                                                {formatCurrency(reportData.totals.totalValuation)}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. MAIN INVENTORY TABLE MATRIX */}
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex flex-wrap items-center justify-between gap-1 text-slate-900 font-bold text-xs uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                <span>OFFICIAL LABORATORY ASSET & EQUIPMENT MATRIX</span>
                                                {reportData.excludedList.length > 0 && (
                                                    <span className="no-print no-pdf inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 normal-case tracking-normal">
                                                        <span>{reportData.excludedList.length} items excluded</span>
                                                        <button
                                                            type="button"
                                                            onClick={handleRestoreAll}
                                                            className="text-amber-700 hover:text-amber-950 underline font-semibold cursor-pointer ml-1"
                                                        >
                                                            Restore All
                                                        </button>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="border border-slate-300 rounded overflow-x-auto print:overflow-visible print:border-slate-400">
                                            <table className="w-full text-[8px] text-left border-collapse print:text-[7.5px] table-auto">
                                                <thead>
                                                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900 uppercase">
                                                        <th className="py-1 px-1 text-center w-5 border-r border-slate-300">#</th>
                                                        <th className="py-1 px-1.5 border-r border-slate-300 whitespace-nowrap">ASSET CODE</th>
                                                        <th className="py-1 px-1.5 border-r border-slate-300 min-w-[140px]">ITEM NAME & SPECIFICATIONS</th>
                                                        <th className="py-1 px-1 border-r border-slate-300 whitespace-nowrap">CATEGORY</th>
                                                        <th className="py-1 px-1 border-r border-slate-300 whitespace-nowrap text-center">FACILITY</th>
                                                        <th className="py-1 px-1 border-r border-slate-300 whitespace-nowrap text-center">SERIAL #</th>
                                                        <th className="py-1 px-1 border-r border-slate-300 whitespace-nowrap text-center">CONDITION</th>
                                                        <th className="py-1 px-1 border-r border-slate-300 whitespace-nowrap text-center">QTY</th>
                                                        <th className="py-1 px-1 border-r border-slate-300 whitespace-nowrap text-right">UNIT COST</th>
                                                        <th className="py-1 px-1 border-r border-slate-300 whitespace-nowrap text-right">TOTAL VALUE</th>
                                                        <th className="py-1 px-1.5 border-r border-slate-300 whitespace-nowrap">CUSTODIAN</th>
                                                        <th className="py-1 px-1 whitespace-nowrap">REMARKS</th>
                                                        <th className="no-print no-pdf py-1 px-1 text-center w-4"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 font-medium">
                                                    {reportData.rows.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={13} className="py-6 text-center text-slate-500 italic">
                                                                No inventory records match the selected facility or filter criteria.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        reportData.rows.map((row, idx) => {
                                                            const cost = Number(row.unit_cost) || 0;
                                                            const qty = Number(row.quantity) || 1;
                                                            const totalCost = cost * qty;

                                                            return (
                                                                <tr key={row.id} className="hover:bg-amber-50/50 transition-colors group">
                                                                    <td className="py-1 px-1 text-center border-r border-slate-200 text-slate-500 font-mono text-[8px]">
                                                                        {idx + 1}
                                                                    </td>
                                                                    <td className="py-1 px-1.5 border-r border-slate-200 font-mono font-bold text-slate-900 whitespace-nowrap">
                                                                        {row.asset_number || '—'}
                                                                    </td>
                                                                    <td className="py-1 px-1.5 border-r border-slate-200 text-slate-900 font-semibold">
                                                                        <div>{row.item_name}</div>
                                                                        {row.brand_model && (
                                                                            <span className="text-[7px] text-slate-500 block font-normal">
                                                                                {row.brand_model}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-1 px-1 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                                                                        {row.category}
                                                                    </td>
                                                                    <td className="py-1 px-1 text-center border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap">
                                                                        {row.room_name}
                                                                    </td>
                                                                    <td className="py-1 px-1 text-center border-r border-slate-200 font-mono text-slate-600 whitespace-nowrap text-[7.5px]">
                                                                        {row.serial_number || '—'}
                                                                    </td>
                                                                    <td className="py-1 px-1 text-center border-r border-slate-200 whitespace-nowrap">
                                                                        <span className="px-1.5 py-0.5 rounded text-[7.5px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                                                                            {row.condition}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-1 px-1 text-center border-r border-slate-200 font-mono font-bold text-slate-900 whitespace-nowrap">
                                                                        {qty} {row.unit}
                                                                    </td>
                                                                    <td className="py-1 px-1 text-right border-r border-slate-200 font-mono text-slate-700 whitespace-nowrap">
                                                                        {cost > 0 ? formatCurrency(cost) : '—'}
                                                                    </td>
                                                                    <td className="py-1 px-1 text-right border-r border-slate-200 font-mono font-bold text-slate-900 whitespace-nowrap">
                                                                        {totalCost > 0 ? formatCurrency(totalCost) : '—'}
                                                                    </td>
                                                                    <td className="py-1 px-1.5 border-r border-slate-200 text-slate-700 whitespace-nowrap text-[7.5px]">
                                                                        {row.custodian || 'Head Lab Custodian'}
                                                                    </td>
                                                                    <td className="py-1 px-1 text-slate-600 text-[7.5px] whitespace-nowrap">
                                                                        {row.remarks || 'Operational'}
                                                                    </td>
                                                                    <td className="no-print no-pdf py-1 px-1 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleExcludeItem(row.id, row.item_name)}
                                                                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5 cursor-pointer"
                                                                            title="Exclude from report"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 5. MONOCHROME LEGEND BOX */}
                                    <div className="border border-slate-300 bg-slate-50/50 p-2 text-[7.5px] rounded space-y-1">
                                        <p className="font-bold text-slate-900 uppercase tracking-wider">
                                            INVENTORY CONDITION DEFINITIONS & VERIFICATION PROTOCOL:
                                        </p>
                                        <p className="text-slate-700">
                                            [ <strong>Operational</strong>: Fully functional with all accessories ] &nbsp;·&nbsp;
                                            [ <strong>Operational with Minor Issue</strong>: Fully usable with reported non-critical cosmetic/software defect ] &nbsp;·&nbsp;
                                            [ <strong>For Repair / Under Maintenance</strong>: Non-functional or flagged for scheduled engineering overhaul ] &nbsp;·&nbsp;
                                            [ <strong>Damaged / Missing</strong>: Subject to property write-off or administrative investigation ]
                                        </p>
                                        <p className="text-slate-500 italic">
                                            This matrix constitutes an authoritative academic property accountability record of the Davao del Sur State College College of Information and Computing Studies (CIDS).
                                        </p>
                                    </div>
                                </div>

                                {/* 6. SIGNATORIES SECTION (Horizontal arrangement, max 3 per row) */}
                                <div className="mt-8 pt-4 page-break-inside-avoid">
                                    <div className="grid grid-cols-3 gap-x-8 gap-y-6 text-center">
                                        {signatoriesList.map((sig) => (
                                            <div key={sig.id} className="space-y-3 min-w-0">
                                                <p className="text-left font-bold text-[10px] text-slate-900">
                                                    {sig.label}:
                                                </p>
                                                <div className="pt-1">
                                                    <p className={cn(
                                                        "font-black text-[10px] text-slate-900 uppercase tracking-wider truncate pb-1",
                                                        sig.showSignatureLine && "border-b border-slate-900"
                                                    )}>
                                                        {sig.name}
                                                    </p>
                                                    <p className="text-[9px] text-slate-600 truncate mt-1">
                                                        {sig.designation}
                                                    </p>
                                                    <p className="text-[8px] text-slate-500 truncate">
                                                        {sig.department}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
