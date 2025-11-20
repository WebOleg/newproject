import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable
    lastAutoTable: {
      finalY: number
    }
  }
}

/**
 * Export analytics data to PDF
 */
export function exportAnalyticsPDF(data: {
  dateRange: string
  stats: {
    totalTransactions: number
    totalVolume: number
    totalChargebacks: number
    chargebackRate: string
    averageTransaction: number
  }
  typeData: Array<{ name: string; value: number; percentage: string }>
  statusData: Array<{ name: string; value: number; percentage: string }>
  schemeData: Array<{ name: string; value: number; percentage: string }>
  transactions: Array<any>
  chargebacks: Array<any>
}) {
  const doc = new jsPDF()
  let yPos = 20

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('EMP Analytics Report', 15, yPos)
  yPos += 10

  // Date range
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Period: ${data.dateRange}`, 15, yPos)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, yPos + 5)
  yPos += 15

  // KPIs
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Key Performance Indicators', 15, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const kpiData = [
    ['Total Transactions', data.stats.totalTransactions.toLocaleString()],
    ['Total Volume', `€${data.stats.totalVolume.toFixed(2)}`],
    ['Total Chargebacks', data.stats.totalChargebacks.toLocaleString()],
    ['Chargeback Rate', data.stats.chargebackRate],
    ['Average Transaction', `€${data.stats.averageTransaction.toFixed(2)}`],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: kpiData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 15 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // Transaction Types
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Transaction Types', 15, yPos)
  yPos += 8

  autoTable(doc, {
    startY: yPos,
    head: [['Type', 'Count', 'Percentage']],
    body: data.typeData.map(t => [t.name, t.value.toLocaleString(), t.percentage]),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 15 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // Transaction Status
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Transaction Status', 15, yPos)
  yPos += 8

  autoTable(doc, {
    startY: yPos,
    head: [['Status', 'Count', 'Percentage']],
    body: data.statusData.map(s => [s.name, s.value.toLocaleString(), s.percentage]),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 15 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // Card Schemes
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Card Schemes', 15, yPos)
  yPos += 8

  autoTable(doc, {
    startY: yPos,
    head: [['Scheme', 'Count', 'Percentage']],
    body: data.schemeData.map(s => [s.name, s.value.toLocaleString(), s.percentage]),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 15 },
  })

  // Transactions table (limited to first 50)
  doc.addPage()
  yPos = 20

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`Recent Transactions (Top ${Math.min(50, data.transactions.length)})`, 15, yPos)
  yPos += 8

  const txRows = data.transactions.slice(0, 50).map(tx => [
    (tx.transactionId || '').substring(0, 12) + '...',
    tx.type || 'N/A',
    tx.status || 'N/A',
    `€${((tx.amount || 0) / 100).toFixed(2)}`,
    tx.postDate ? new Date(tx.postDate).toLocaleDateString() : 'N/A',
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Transaction ID', 'Type', 'Status', 'Amount', 'Date']],
    body: txRows,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 15 },
    styles: { fontSize: 8 },
  })

  // Chargebacks table (if any)
  if (data.chargebacks.length > 0) {
    doc.addPage()
    yPos = 20

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Chargebacks (${data.chargebacks.length})`, 15, yPos)
    yPos += 8

    const cbRows = data.chargebacks.map(cb => [
      (cb.uniqueId || '').substring(0, 12) + '...',
      cb.reasonCode || 'N/A',
      (cb.reasonDescription || 'N/A').substring(0, 30),
      `€${((cb.amount || 0) / 100).toFixed(2)}`,
      cb.postDate ? new Date(cb.postDate).toLocaleDateString() : 'N/A',
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Unique ID', 'Code', 'Reason', 'Amount', 'Date']],
      body: cbRows,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
      margin: { left: 15 },
      styles: { fontSize: 8 },
    })
  }

  // Save
  const filename = `EMP_Analytics_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

/**
 * Export batch chargeback analysis to PDF
 */
export function exportBatchChargebacksPDF(data: {
  dateRange: string
  summary: {
    totalBatches: number
    totalChargebacks: number
    totalAmount: number
    unmatchedChargebacks: number
  }
  batches: Array<{
    uploadId: string
    filename: string
    createdAt: string
    totalRecords: number
    approvedCount: number
    chargebackCount: number
    chargebackRate: string
    chargebackAmount: number
    chargebacks: Array<{
      uniqueId?: string
      originalTransactionUniqueId: string
      transactionId: string
      reasonCode: string
      reasonDescription: string
      amount: number
      postDate: string
      arn?: string
    }>
  }>
}) {
  const doc = new jsPDF()
  let yPos = 20

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Batch Chargeback Analysis', 15, yPos)
  yPos += 10

  // Date range
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Period: ${data.dateRange}`, 15, yPos)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, yPos + 5)
  yPos += 15

  // Summary
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', 15, yPos)
  yPos += 8

  const summaryData = [
    ['Total Batches Analyzed', data.summary.totalBatches.toLocaleString()],
    ['Total Chargebacks', data.summary.totalChargebacks.toLocaleString()],
    ['Total Chargeback Amount', `€${(data.summary.totalAmount / 100).toFixed(2)}`],
    ['Unmatched Chargebacks', data.summary.unmatchedChargebacks.toLocaleString()],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 15 },
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // Batch overview
  if (yPos > 220) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Batch Overview', 15, yPos)
  yPos += 8

  const batchRows = data.batches.map(b => [
    b.filename.substring(0, 25),
    new Date(b.createdAt).toLocaleDateString(),
    b.totalRecords.toLocaleString(),
    b.approvedCount.toLocaleString(),
    b.chargebackCount.toLocaleString(),
    b.chargebackRate,
    `€${(b.chargebackAmount / 100).toFixed(2)}`,
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Filename', 'Date', 'Records', 'Approved', 'CBs', 'CB Rate', 'CB Amount']],
    body: batchRows,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 15 },
    styles: { fontSize: 7 },
  })

  // Detailed chargebacks by batch
  data.batches.forEach((batch, idx) => {
    if (batch.chargebacks.length === 0) return

    doc.addPage()
    yPos = 20

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Batch ${idx + 1}: ${batch.filename}`, 15, yPos)
    yPos += 5

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Uploaded: ${new Date(batch.createdAt).toLocaleDateString()} | Chargebacks: ${batch.chargebackCount} | Rate: ${batch.chargebackRate}`, 15, yPos)
    yPos += 10

    const cbRows = batch.chargebacks.map(cb => [
      (cb.transactionId || '').substring(0, 10) + '...',
      (cb.originalTransactionUniqueId || '').substring(0, 10) + '...',
      cb.reasonCode,
      (cb.reasonDescription || 'N/A').substring(0, 25),
      `€${((cb.amount || 0) / 100).toFixed(2)}`,
      cb.postDate ? new Date(cb.postDate).toLocaleDateString() : 'N/A',
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['Tx ID', 'Orig Tx ID', 'Code', 'Reason', 'Amount', 'Date']],
      body: cbRows,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
      margin: { left: 15 },
      styles: { fontSize: 7 },
    })
  })

  // Save
  const filename = `Batch_Chargebacks_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

/**
 * Export chargeback extraction report (by file/batch with comparison)
 */
export function exportChargebackExtractionPDF(data: {
  dateRange: string
  previousPeriod?: string
  batches: Array<{
    filename: string
    uploadDate: string
    totalTransactions: number
    chargebacks: Array<{
      transactionId: string
      originalTransactionUniqueId: string
      amount: number
      postDate: string
      reasonCode: string
      reasonDescription: string
      customerName?: string
      iban?: string
    }>
    previousChargebacks?: Array<any>
  }>
}) {
  const doc = new jsPDF('landscape') // Use landscape for more columns
  let yPos = 20

  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Chargeback Extraction Report', 15, yPos)
  yPos += 10

  // Date range
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Current Period: ${data.dateRange}`, 15, yPos)
  if (data.previousPeriod) {
    doc.text(`Previous Period: ${data.previousPeriod}`, 15, yPos + 5)
  }
  doc.text(`Generated: ${new Date().toLocaleString()}`, 15, yPos + 10)
  yPos += 20

  // Process each batch (file) separately
  data.batches.forEach((batch, idx) => {
    if (idx > 0) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`File: ${batch.filename}`, 15, yPos)
    yPos += 5

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Upload Date: ${new Date(batch.uploadDate).toLocaleDateString()} | Total Transactions: ${batch.totalTransactions}`, 15, yPos)
    doc.text(`Chargebacks: ${batch.chargebacks.length}${batch.previousChargebacks ? ` | Previous Period: ${batch.previousChargebacks.length}` : ''}`, 15, yPos + 4)
    yPos += 12

    // Current period chargebacks
    if (batch.chargebacks.length > 0) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Current Period Chargebacks:', 15, yPos)
      yPos += 6

      const cbRows = batch.chargebacks.map(cb => [
        (cb.transactionId || '').substring(0, 12),
        cb.customerName || 'N/A',
        (cb.iban || 'N/A').substring(0, 15),
        `€${((cb.amount || 0) / 100).toFixed(2)}`,
        cb.reasonCode,
        (cb.reasonDescription || 'N/A').substring(0, 30),
        cb.postDate ? new Date(cb.postDate).toLocaleDateString() : 'N/A',
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['Transaction ID', 'Customer', 'IBAN', 'Amount', 'Code', 'Reason', 'Date']],
        body: cbRows,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 7 },
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Previous period chargebacks (if available)
    if (batch.previousChargebacks && batch.previousChargebacks.length > 0) {
      if (yPos > 160) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Previous Period Chargebacks:', 15, yPos)
      yPos += 6

      const prevRows = batch.previousChargebacks.map((cb: any) => [
        (cb.transactionId || '').substring(0, 12),
        cb.customerName || 'N/A',
        (cb.iban || 'N/A').substring(0, 15),
        `€${((cb.amount || 0) / 100).toFixed(2)}`,
        cb.reasonCode,
        (cb.reasonDescription || 'N/A').substring(0, 30),
        cb.postDate ? new Date(cb.postDate).toLocaleDateString() : 'N/A',
      ])

      autoTable(doc, {
        startY: yPos,
        head: [['Transaction ID', 'Customer', 'IBAN', 'Amount', 'Code', 'Reason', 'Date']],
        body: prevRows,
        theme: 'striped',
        headStyles: { fillColor: [156, 163, 175] },
        margin: { left: 15, right: 15 },
        styles: { fontSize: 7 },
      })
    }
  })

  // Save
  const filename = `Chargeback_Extraction_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(filename)
}

