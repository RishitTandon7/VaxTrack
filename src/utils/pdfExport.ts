import jsPDF from 'jspdf';
import { VaccinationRecord, Patient, Doctor } from '../lib/supabase';
import { format } from 'date-fns';

interface FormattedVaccinationRecord {
  id: string;
  patientId: string;
  vaccineName: string;
  dateAdministered: string;
  nextDueDate?: string;
  batchNumber?: string;
  administeredBy: string;
  notes?: string;
  cardImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormattedPatient {
  id: string;
  name: string;
  email: string;
  role: 'patient';
  dateOfBirth: string;
  parentName: string;
  parentPhone: string;
  doctorId: string;
}

interface FormattedDoctor {
  id: string;
  name: string;
  email: string;
  role: 'doctor';
  license: string;
  specialization: string;
  clinic: string;
}

export const exportVaccinationRecordsPDF = (
  patient: FormattedPatient,
  records: FormattedVaccinationRecord[],
  doctor?: FormattedDoctor
): void => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  
  // Header
  pdf.setFontSize(20);
  pdf.setTextColor(59, 130, 246); // Blue color
  pdf.text('Vaccination Record', margin, 30);
  
  // Patient Information
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Patient Information', margin, 50);
  
  pdf.setFontSize(11);
  let yPos = 65;
  pdf.text(`Name: ${patient.name}`, margin, yPos);
  yPos += 8;
  pdf.text(`Date of Birth: ${format(new Date(patient.dateOfBirth), 'MMMM dd, yyyy')}`, margin, yPos);
  yPos += 8;
  pdf.text(`Parent/Guardian: ${patient.parentName}`, margin, yPos);
  yPos += 8;
  pdf.text(`Contact: ${patient.parentPhone}`, margin, yPos);
  
  if (doctor) {
    yPos += 8;
    pdf.text(`Doctor: ${doctor.name}`, margin, yPos);
    yPos += 8;
    pdf.text(`Clinic: ${doctor.clinic}`, margin, yPos);
  }
  
  // Vaccination Records
  yPos += 20;
  pdf.setFontSize(14);
  pdf.text('Vaccination History', margin, yPos);
  
  yPos += 15;
  
  if (records.length === 0) {
    pdf.setFontSize(11);
    pdf.text('No vaccination records found.', margin, yPos);
  } else {
    // Table headers
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('Vaccine', margin, yPos);
    pdf.text('Date Given', margin + 60, yPos);
    pdf.text('Next Due', margin + 120, yPos);
    pdf.text('Given By', margin + 170, yPos);
    
    yPos += 8;
    pdf.setFont(undefined, 'normal');
    
    // Draw line under headers
    pdf.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
    
    records.forEach((record) => {
      if (yPos > 270) { // New page if needed
        pdf.addPage();
        yPos = 30;
      }
      
      pdf.text(record.vaccineName, margin, yPos);
      pdf.text(format(new Date(record.dateAdministered), 'MM/dd/yyyy'), margin + 60, yPos);
      
      if (record.nextDueDate) {
        pdf.text(format(new Date(record.nextDueDate), 'MM/dd/yyyy'), margin + 120, yPos);
      } else {
        pdf.text('N/A', margin + 120, yPos);
      }
      
      // Truncate long names
      const adminBy = record.administeredBy.length > 20 
        ? record.administeredBy.substring(0, 20) + '...' 
        : record.administeredBy;
      pdf.text(adminBy, margin + 170, yPos);
      
      yPos += 10;
      
      if (record.notes) {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        const notes = record.notes.length > 80 
          ? record.notes.substring(0, 80) + '...' 
          : record.notes;
        pdf.text(`Notes: ${notes}`, margin + 10, yPos);
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        yPos += 8;
      }
    });
  }
  
  // Footer
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Generated on ${format(new Date(), 'MMMM dd, yyyy')} - Page ${i} of ${pageCount}`,
      margin,
      pdf.internal.pageSize.getHeight() - 10
    );
  }
  
  // Save the PDF
  const fileName = `${patient.name.replace(/\s+/g, '_')}_Vaccination_Record.pdf`;
  pdf.save(fileName);
};