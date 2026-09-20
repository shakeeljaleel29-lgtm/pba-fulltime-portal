/**
 * Utility functions for CSV & Excel file parsing and template downloads.
 */

export const downloadStudentCsvTemplate = () => {
  const headers = [
    "Full Name",
    "Date of Birth (YYYY-MM-DD)",
    "Gender (Male/Female/Other)",
    "NIC / Passport",
    "Phone",
    "Parent/Guardian Phone",
    "Email",
    "Branch (Kohuwala/Wattala/Panadura)",
    "Batch Name",
    "Subjects (semicolon-separated e.g. Biology;Chemistry;Physics)",
    "Notes"
  ];
  const sampleRow = [
    "Saman Kumara",
    "2006-05-15",
    "Male",
    "200613501234",
    "0771234567",
    "0719876543",
    "saman@example.com",
    "Kohuwala",
    "Batch 2024-A (A/L Commerce)",
    "Business Studies;Accounting;Economics",
    "Enrolled via scholarship"
  ];
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), sampleRow.join(",")].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "student_import_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadLecturerCsvTemplate = () => {
  const headers = [
    "Full Name",
    "Phone",
    "Email",
    "Branch (Kohuwala/Wattala/Panadura/All)",
    "Subjects They Teach (semicolon-separated)",
    "Qualification",
    "Notes",
    "Employment Type (Full-time/Part-time/Visiting)"
  ];
  const sampleRow = [
    "Dr. Nimal Perera",
    "0773456789",
    "nimal@pba.edu.lk",
    "Kohuwala",
    "Business Studies;Accounting",
    "Ph.D. in Financial Management",
    "Senior Lecturer",
    "Full-time"
  ];
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), sampleRow.join(",")].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "lecturer_import_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Lazy loads SheetJS if needed for Excel files (.xlsx, .xls)
 * or parses CSV files natively using FileReader.
 */
export const parseImportFile = async (file) => {
  return new Promise((resolve, reject) => {
    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith(".csv");

    if (isCsv) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
          if (lines.length === 0) return resolve([]);
          
          const parseLine = (line) => {
            const result = [];
            let insideQuote = false;
            let entry = "";
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                insideQuote = !insideQuote;
              } else if (char === ',' && !insideQuote) {
                result.push(entry.trim().replace(/^"|"$/g, ''));
                entry = "";
              } else {
                entry += char;
              }
            }
            result.push(entry.trim().replace(/^"|"$/g, ''));
            return result;
          };

          const headers = parseLine(lines[0]);
          const rows = lines.slice(1).map((line) => {
            const values = parseLine(line);
            const rowObj = {};
            headers.forEach((h, idx) => {
              rowObj[h] = values[idx] !== undefined ? values[idx] : "";
            });
            return rowObj;
          });
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    } else {
      // Excel File - Lazy Load SheetJS
      const loadScript = () => {
        if (window.XLSX) return Promise.resolve();
        return new Promise((res, rej) => {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js";
          script.onload = () => res();
          script.onerror = () => rej(new Error("Failed to load SheetJS from CDN"));
          document.body.appendChild(script);
        });
      };

      loadScript()
        .then(() => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = new Uint8Array(e.target.result);
              const workbook = window.XLSX.read(data, { type: "array" });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              const json = window.XLSX.utils.sheet_to_json(worksheet, { defval: "" });
              resolve(json);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (err) => reject(err);
          reader.readAsArrayBuffer(file);
        })
        .catch(reject);
    }
  });
};
