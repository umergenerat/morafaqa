import { GoogleGenAI, Type } from "@google/genai";
import { Student, BehaviorRecord, HealthRecord } from '../types';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

// Helper to get AI instance
const getAiInstance = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.warn("VITE_GEMINI_API_KEY is missing in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

// Helper to convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    // Limit to first 5 pages to avoid token limits for demo
    const maxPages = Math.min(pdf.numPages, 5);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const strings = textContent.items.map((item: any) => item.str);
      fullText += `Page ${i}:\n` + strings.join(' ') + '\n\n';
    }
    return fullText;
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    throw new Error("Failed to extract text from PDF");
  }
};

const extractTextFromExcel = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);

    // Read the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    return JSON.stringify(jsonData, null, 2);
  } catch (error) {
    console.error("Excel Extraction Error:", error);
    throw new Error("Failed to parse Excel file");
  }
};

export const generateStudentReport = async (
  student: Student,
  behavior: BehaviorRecord[],
  health: HealthRecord[]
): Promise<{ summary: string; recommendations: string[] } | null> => {
  const ai = getAiInstance();
  if (!ai) {
    return {
      summary: "عذراً، خدمة الذكاء الاصطناعي غير متوفرة.",
      recommendations: ["يرجى التحقق من إعدادات النظام."]
    };
  }

  try {
    const prompt = `
      أنت مساعد ذكي في منصة إدارة مدرسة داخلية. قم بتحليل بيانات التلميذ التالية واكتب تقريراً موجزاً ومفيداً للإدارة والوالدين.
      
      اسم التلميذ: ${student.fullName}
      الجنس: ${student.gender === 'male' ? 'ذكر' : 'أنثى'}
      المستوى: ${student.grade}
      
      سجل السلوك:
      ${JSON.stringify(behavior)}
      
      السجل الصحي:
      ${JSON.stringify(health)}
      
      المطلوب:
      1. ملخص عام لحالة التلميذ (سلوكياً وصحياً) بنبرة مهنية.
      2. قائمة من 3 توصيات لتحسين وضع التلميذ.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      const cleanText = response.text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanText);
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      summary: "حدث خطأ أثناء توليد التقرير.",
      recommendations: []
    };
  }
};

export const draftParentMessage = async (
  studentName: string,
  topic: 'absence' | 'health' | 'behavior' | 'general',
  details: string
): Promise<string> => {
  const ai = getAiInstance();
  if (!ai) return "الرجاء التحقق من إعدادات النظام";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `
        اكتب رسالة نصية قصيرة ومهنية (SMS/WhatsApp) لإرسالها إلى ولي أمر الطالب "${studentName}".
        الموضوع: ${topic === 'absence' ? 'غياب' : topic === 'health' ? 'حالة صحية طارئة' : topic === 'behavior' ? 'سلوك' : 'عام'}.
        التفاصيل: ${details}.
        
        الشروط:
        - ابدأ بالتحية (مؤسسة مرافقة).
        - كن موجزاً وواضحاً.
        - لا تضع أقواساً أو علامات تنصيص زائدة.
        - اللهجة: رسمية ومهذبة.
      `,
    });
    return response.text ? response.text.replace(/```/g, '').trim() : "";
  } catch (e) {
    console.error(e);
    return "حدث خطأ في صياغة الرسالة";
  }
};

export type ImportContext = 'students' | 'health' | 'attendance' | 'academics';

export const analyzeUploadedDocument = async (
  file: File,
  context: ImportContext
): Promise<any> => {
  const ai = getAiInstance();
  if (!ai) throw new Error("API Key Missing.");

  let promptContent = '';
  let parts: any[] = [];

  // Determine file type and extract content
  if (file.type.startsWith('image/')) {
    const base64Part = await fileToGenerativePart(file);
    parts = [base64Part];
    promptContent = `Analyze the attached image.`;
  } else if (file.type === 'application/pdf') {
    const extractedText = await extractTextFromPDF(file);
    promptContent = `Analyze the following text extracted from a PDF document:\n${extractedText}`;
  } else if (
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel' ||
    file.name.endsWith('.xlsx') ||
    file.name.endsWith('.csv')
  ) {
    const extractedJson = await extractTextFromExcel(file);
    promptContent = `Analyze the following data extracted from a spreadsheet (Excel/CSV):\n${extractedJson}`;
  } else {
    throw new Error("Unsupported file type");
  }

  // Specific instructions based on context
  let contextInstructions = '';

  if (context === 'students') {
    contextInstructions = `
      Extract a list of students.
      Output JSON Format:
      {
        "type": "students",
        "data": [
          {
            "fullName": "Student Name",
            "grade": "Grade Level",
            "roomNumber": "Room Number (if available, else empty string)",
            "guardianPhone": "Phone Number (if available, else empty string)",
            "gender": "male" or "female" (infer from name if not explicit),
            "academicId": "Massar ID/CNE (if available, else random string)",
            "scholarshipType": "full" (default),
            "guardianAddress": "Address (if available)",
            "guardianId": "Guardian National ID/CIN/CNIE (Use empty string if not found)"
          }
        ]
      }
    `;
  } else if (context === 'health') {
    contextInstructions = `
      Extract health records/visits.
      Output JSON Format:
      {
        "type": "health",
        "data": [
          {
            "studentName": "Student Full Name",
            "condition": "Medical Condition/Reason",
            "medication": "Prescribed Medication (optional)",
            "notes": "Doctor notes or details",
            "severity": "low" | "medium" | "high",
            "date": "YYYY-MM-DD" (use today if not specified)
          }
        ]
      }
    `;
  } else if (context === 'attendance') {
    contextInstructions = `
      Extract attendance records.
      Output JSON Format:
      {
        "type": "attendance",
        "data": [
          {
            "studentName": "Student Full Name",
            "date": "YYYY-MM-DD",
            "status": "present" | "absent" | "late"
          }
        ]
      }
    `;
  } else if (context === 'academics') {
    contextInstructions = `
      Extract academic results/grades.
      Output JSON Format:
      {
        "type": "academics",
        "data": [
          {
            "studentName": "Student Full Name",
            "semester": "S1" or "S2",
            "generalAverage": Number (0-20),
            "rank": Number (optional),
            "subjects": [
              { "subjectName": "Subject Name", "grade": Number, "coefficient": Number (default 1) }
            ]
          }
        ]
      }
    `;
  }

  // Common system prompt
  const systemInstructions = `
    You are an intelligent data extraction system for a boarding school.
    Your goal is to extract structured data from the provided content (Text, Image, or Excel JSON) matching the requested format perfectly.
    - If specific fields are missing, infer reasonable defaults or leave empty strings.
    - Be precise with names and numbers.
    - Return ONLY the JSON object. No markdown code blocks.
    ${contextInstructions}
  `;

  // Combine instructions
  const fullPrompt = `${systemInstructions}\n\n${promptContent}`;

  try {
    const contentInput = parts.length > 0
      ? { role: 'user', parts: [...parts, { text: systemInstructions }] }
      : { role: 'user', parts: [{ text: fullPrompt }] };

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [contentInput],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text ? response.text.replace(/```json|```/g, '').trim() : "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("Failed to process document");
  }
};