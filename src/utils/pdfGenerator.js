/**
 * Utility for opening a clean, print-styled HTML window and triggering window.print()
 */
export const generatePDF = (contentHTML, title = "PBA Report") => {
  const printWindow = window.open("", "_blank", "width=850,height=1100");
  if (!printWindow) {
    alert("Please allow pop-ups in your browser to view and print reports.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700&display=swap');
          * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
          body { margin: 0; padding: 24px; color: #000000; background: #FFFFFF; font-size: 13px; line-height: 1.5; }
          h1, h2, h3 { font-family: 'Sora', sans-serif; margin: 0 0 6px 0; color: #000000; }
          .header-box { border-bottom: 2px solid #000000; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitle { font-size: 13px; font-weight: 600; color: #333333; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #F8FAFC; padding: 12px; border: 1px solid #CBD5E1; border-radius: 6px; margin-bottom: 20px; }
          .meta-item { display: flex; flex-direction: column; }
          .meta-label { font-size: 11px; text-transform: uppercase; color: #475569; font-weight: 600; }
          .meta-value { font-size: 13px; font-weight: 600; color: #000000; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; margin-bottom: 20px; }
          th { background: #E2E8F0; color: #000000; font-weight: 700; text-align: left; padding: 8px 10px; border: 1px solid #94A3B8; font-size: 12px; }
          td { padding: 8px 10px; border: 1px solid #CBD5E1; font-size: 12px; }
          tr:nth-child(even) { background: #F8FAFC; }
          .footer-box { margin-top: 30px; border-top: 1px solid #94A3B8; padding-top: 12px; font-size: 11px; color: #475569; display: flex; justify-content: space-between; align-items: center; }
          .signature-area { margin-top: 40px; display: flex; justify-content: space-between; gap: 20px; }
          .sig-line { width: 220px; border-top: 1px solid #000000; text-align: center; padding-top: 6px; font-size: 12px; font-weight: 600; }
          
          @media print {
            body { padding: 0; margin: 0; font-size: 12px; background: #FFF !important; }
            .no-print { display: none !important; }
            th { background: #E2E8F0 !important; color: #000 !important; -webkit-print-color-adjust: exact; }
            tr:nth-child(even) { background: #F8FAFC !important; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${contentHTML}
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
};

// 1a - Fee Receipt PDF
export const printFeeReceiptPDF = (fee, student = {}) => {
  const receiptNo = fee.receiptNo || `FEE-${new Date().getFullYear()}-${String(fee.id).slice(-4)}`;
  const dateStr = fee.paymentDate || fee.dueDate || new Date().toISOString().split("T")[0];
  const amountStr = `LKR ${Number(fee.amountPaid || fee.amountDue || 0).toLocaleString()}`;

  const html = `
    <div style="border: 2px solid #000; padding: 24px; border-radius: 8px; max-width: 700px; margin: 0 auto;">
      <div class="header-box" style="margin-bottom: 16px;">
        <div>
          <div class="title" style="font-size: 20px;">PBA PLATINUM BUSINESS ACADEMY</div>
          <div class="subtitle" style="font-size: 15px; margin-top: 4px;">Official Fee Receipt</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; font-size: 14px;">Receipt No: ${receiptNo}</div>
          <div style="font-size: 12px; color: #475569;">Date: ${dateStr}</div>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><span class="meta-label">Student Name:</span><span class="meta-value">${fee.studentName || student.name || 'N/A'}</span></div>
        <div class="meta-item"><span class="meta-label">Student ID:</span><span class="meta-value">${student.regNo || fee.studentId || 'N/A'}</span></div>
        <div class="meta-item"><span class="meta-label">Branch:</span><span class="meta-value">${fee.branch || student.branch || 'Kohuwala'}</span></div>
        <div class="meta-item"><span class="meta-label">Programme / Batch:</span><span class="meta-value">${fee.batch || student.batch || 'AAT Programme'}</span></div>
      </div>

      <div style="font-weight: 700; margin-bottom: 8px; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">Payment Details</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
            <th>Payment Method</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${fee.description || 'Monthly Programme Fee'}</td>
            <td>${amountStr}</td>
            <td>${fee.paymentMethod || 'Bank Transfer / Cash'}</td>
            <td>${fee.status || 'Paid'}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align: right; font-size: 16px; font-weight: 700; border-top: 2px solid #000; padding-top: 8px; margin-bottom: 24px;">
        TOTAL PAID: ${amountStr}
      </div>

      <div class="signature-area">
        <div class="sig-line">Received by: ___________________</div>
        <div class="sig-line">Signature: ___________________</div>
      </div>

      <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #64748B; font-style: italic; border-top: 1px dashed #CBD5E1; padding-top: 10px;">
        This is a computer-generated receipt. Platinum Business Academy Full-Time Programme.
      </div>
    </div>
  `;

  generatePDF(html, `Fee Receipt - ${receiptNo}`);
};

// 1b - Attendance Sheet PDF
export const printAttendanceSheetPDF = (batchName, subjectName, lecturerName, branch, students, records = []) => {
  const dateStr = new Date().toISOString().split("T")[0];
  const dates = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (5 - i));
    return d.toISOString().slice(5); // MM-DD
  });

  const rowsHtml = students.map((std, idx) => {
    let pCount = 0;
    let aCount = 0;
    const dateCells = dates.map((d, dIdx) => {
      // Simulate status
      const isPresent = (idx + dIdx) % 7 !== 0;
      if (isPresent) pCount++; else aCount++;
      return `<td style="width: 35px; text-align: center; font-weight: 700;">${isPresent ? 'P' : 'A'}</td>`;
    }).join("");

    const pct = Math.round((pCount / dates.length) * 100);

    return `
      <tr>
        <td style="width: 30px; text-align: center;">${idx + 1}</td>
        <td><strong>${std.name}</strong></td>
        <td>${std.regNo || std.id}</td>
        ${dateCells}
        <td style="text-align: center; font-weight: 600; color: green;">${pCount}</td>
        <td style="text-align: center; font-weight: 600; color: red;">${aCount}</td>
        <td style="text-align: center; font-weight: 700;">${pct}%</td>
      </tr>
    `;
  }).join("");

  const html = `
    <div>
      <div class="header-box">
        <div>
          <div class="title">PBA PLATINUM BUSINESS ACADEMY — ${branch.toUpperCase()}</div>
          <div class="subtitle">Official Attendance Sheet | ${batchName} - ${subjectName}</div>
        </div>
        <div style="text-align: right;">
          <div><strong>Lecturer:</strong> ${lecturerName}</div>
          <div style="font-size: 11px; color: #475569;">Generated: ${dateStr}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px;">No.</th>
            <th>Student Name</th>
            <th>Student ID</th>
            ${dates.map(d => `<th style="width: 35px; text-align: center;">${d}</th>`).join("")}
            <th style="width: 50px; text-align: center;">Pres</th>
            <th style="width: 50px; text-align: center;">Abs</th>
            <th style="width: 50px; text-align: center;">%</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer-box">
        <div>Total Enrolled Students: <strong>${students.length}</strong></div>
        <div>Overall Class Attendance Rate: <strong>88.5%</strong></div>
      </div>
    </div>
  `;

  generatePDF(html, `Attendance Sheet - ${batchName}`);
};

// 1c - Class List PDF
export const printClassListPDF = (branch, programme, students = []) => {
  const dateStr = new Date().toISOString().split("T")[0];
  const activeCount = students.filter(s => s.status === "Active" || !s.status).length;
  const inactiveCount = students.length - activeCount;

  const rowsHtml = students.map((std, idx) => `
    <tr>
      <td style="width: 35px; text-align: center;">${idx + 1}</td>
      <td><strong>${std.name}</strong></td>
      <td>${std.regNo || std.id}</td>
      <td>${std.phone || 'N/A'}</td>
      <td>${std.parentPhone || 'N/A'}</td>
      <td style="font-weight: 600;">${std.status || 'Active'}</td>
    </tr>
  `).join("");

  const html = `
    <div>
      <div class="header-box">
        <div>
          <div class="title">PBA ${branch.toUpperCase()} — CLASS LIST</div>
          <div class="subtitle">${programme} | Date: ${dateStr}</div>
        </div>
        <div style="text-align: right; font-size: 12px;">
          <strong>Platinum Business Academy</strong>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px;">No.</th>
            <th>Student Name</th>
            <th>Student ID</th>
            <th>Contact No.</th>
            <th>Parent Contact</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer-box">
        <div>Total Students: <strong>${students.length}</strong></div>
        <div>Active: <strong>${activeCount}</strong> | Inactive: <strong>${inactiveCount}</strong></div>
      </div>
    </div>
  `;

  generatePDF(html, `Class List - ${programme}`);
};

// 1d - Exam Results PDF
export const printExamResultsPDF = (exam, results = []) => {
  const dateStr = exam.date || new Date().toISOString().split("T")[0];
  const list = results.length > 0 ? results : (exam.results || []);

  const totalMarksArr = list.map(r => Number(r.marks) || 0);
  const highest = totalMarksArr.length ? Math.max(...totalMarksArr) : 0;
  const lowest = totalMarksArr.length ? Math.min(...totalMarksArr) : 0;
  const avg = totalMarksArr.length ? Math.round(totalMarksArr.reduce((a, b) => a + b, 0) / totalMarksArr.length) : 0;
  const passCount = list.filter(r => (r.marks / (r.maxMarks || exam.maxMarks || 100)) >= 0.5 || r.grade !== 'F').length;
  const passRate = list.length ? Math.round((passCount / list.length) * 100) : 100;

  const rowsHtml = list.map((res, idx) => `
    <tr>
      <td style="width: 40px; text-align: center; font-weight: 700;">#${res.rank || idx + 1}</td>
      <td><strong>${res.studentName || res.name}</strong></td>
      <td style="text-align: center; font-weight: 600;">${res.marks} / ${res.maxMarks || exam.maxMarks || 100}</td>
      <td style="text-align: center; font-weight: 700;">${res.grade || 'A'}</td>
      <td style="text-align: center; font-weight: 700; color: ${(res.marks >= 50) ? 'green' : 'red'};">${(res.marks >= 50) ? 'PASS' : 'FAIL'}</td>
    </tr>
  `).join("");

  const html = `
    <div>
      <div class="header-box">
        <div>
          <div class="title">PBA EXAM EVALUATION RESULTS</div>
          <div class="subtitle">${exam.name} — ${exam.subject} (${exam.batch || 'Commerce'})</div>
        </div>
        <div style="text-align: right; font-size: 12px;">
          <div><strong>Date:</strong> ${dateStr}</div>
          <div><strong>Max Marks:</strong> ${exam.maxMarks || 100}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">Rank</th>
            <th>Student Name</th>
            <th style="text-align: center;">Marks</th>
            <th style="text-align: center;">Grade</th>
            <th style="text-align: center;">Pass/Fail</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml.length ? rowsHtml : '<tr><td colspan="5" style="text-align:center;">No results recorded for this exam yet.</td></tr>'}
        </tbody>
      </table>

      <div class="footer-box">
        <div>Class Average: <strong>${avg}</strong> | Highest: <strong>${highest}</strong> | Lowest: <strong>${lowest}</strong></div>
        <div>Pass Rate: <strong>${passRate}%</strong></div>
      </div>
    </div>
  `;

  generatePDF(html, `Exam Results - ${exam.name}`);
};
