
import { GoogleGenAI, Type } from "@google/genai";
import { Student, BehaviorRecord, HealthRecord } from '../types';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs`;

// Helper to get AI instance
const getAiInstance = () => {
  // 1. Try to get key from Local Storage (Settings)
  let storedKey = '';
  try {
    const settingsStr = localStorage.getItem('morafaka_settings');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      storedKey = settings.apiKey || '';
    }
  } catch (e) {
    console.warn("Failed to read settings from local storage");
  }

  // 2. Fallback to Env variable
  const apiKey = storedKey || process.env.API_KEY;

  if (!apiKey) {
    console.error("API Key is missing. Please check Settings or Environment Variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
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
      summary: "عذراً، خدمة الذكاء الاصطناعي غير متوفرة. يرجى إدخال مفتاح API في الإعدادات.",
      recommendations: ["تأكد من إعداد مفتاح API"]
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
      model: 'gemini-2.5-flash',
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
      return JSON.parse(response.text);
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
  if (!ai) return "الرجاء التحقق من إعدادات مفتاح API في صفحة الإعدادات";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    return response.text || "";
  } catch (e) {
    console.error(e);
    return "حدث خطأ في صياغة الرسالة";
  }
};

export type ImportContext = 'students' | 'grades' | 'medical' | 'behavior' | 'academics' | 'health' | 'attendance';

// Helper for Local Excel Parsing strategy
const parseExcelLocally = (jsonData: any[], context: ImportContext): any[] | null => {
  // 1. Define heuristics mapping
  const mappings: Record<string, string[]> = {
    // Students
    fullName: ['name', 'nom', 'prenom', 'full', 'الاسم', 'etudiant', 'student'],
    academicId: ['massar', 'cne', 'code', ' رقم', 'id'],
    grade: ['niveau', 'classe', 'grade', 'المستوى', 'قسم'],
    guardianId: ['cin', 'cnie', 'parent', 'guardian', 'بطاقة', 'ولي'],
    guardianPhone: ['phone', 'tel', 'mobile', 'portable', 'هاتف'],
    scholarshipNumber: ['bourse', 'minhat', 'منحة'],
    roomNumber: ['chambre', 'room', 'salle', 'غرفة'],

    // Health
    studentName: ['name', 'nom', 'prenom', 'etudiant', 'student', 'الاسم'],
    condition: ['maladie', 'condition', 'status', 'etat', 'حالة', 'مرض'],

    // Behavior
    type: ['type', 'nature', 'نوع', 'نمط'],
    category: ['category', 'classification', 'تصنيف', 'فئة'],
    description: ['description', 'details', 'note', 'وصف', 'ملاحظة', 'سلوك'],
    date: ['date', 'time', 'تاريخ', 'وقت'],

    // Grades
    generalAverage: ['moyen', 'average', 'note', ' معدل', 'resultat'],
  };

  if (jsonData.length === 0) return null;

  // 2. Identify keys in the first row
  const firstRow = jsonData[0];
  const keys = Object.keys(firstRow);

  // 3. Score the keys against our context
  // Simple containment check
  const mapKey = (key: string): string | null => {
    const lowerKey = key.toLowerCase();
    for (const [targetField, keywords] of Object.entries(mappings)) {
      if (keywords.some(k => lowerKey.includes(k))) return targetField;
    }
    return null;
  };

  // 4. Transform data if confidence is high (at least one critical field found)
  const mappedData = jsonData.map(row => {
    const newRow: any = {};
    let foundCritical = false;

    Object.entries(row).forEach(([key, value]) => {
      const target = mapKey(key);
      if (target) {
        newRow[target] = value;
        if (['fullName', 'studentName', 'academicId'].includes(target)) foundCritical = true;
      } else {
        // Keep unknown keys just in case? Or discard. Let's keep as 'raw_key'
        newRow[key] = value;
      }
    });

    // Normalization hacks
    if (newRow.academicId) newRow.academicId = String(newRow.academicId);
    if (newRow.guardianId) newRow.guardianId = String(newRow.guardianId);

    return foundCritical ? newRow : null;
  }).filter(Boolean);

  // If we converted > 50% of rows successfully, trust this method
  if (mappedData.length > jsonData.length * 0.5) {
    return mappedData;
  }

  return null;
};

export const analyzeUploadedDocument = async (
  file: File,
  context: ImportContext
): Promise<any> => {
  const isSpreadsheet = file.type.includes('sheet') || file.type.includes('excel') || file.name.endsWith('.csv') || file.name.endsWith('.xlsx');

  // ---------------------------------------------------------
  // STRATEGY 1: Local Deterministic Parsing (Fast & Reliable)
  // ---------------------------------------------------------
  if (isSpreadsheet) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const localResult = parseExcelLocally(jsonData as any[], context);

      if (localResult) {
        console.log("Local Excel parsing successful:", localResult.length, "items.");
        return { type: context, data: localResult };
      }
      console.warn("Local parsing result empty or low confidence. Attempting AI extraction...");
    } catch (e) {
      console.warn("Local Excel read error, trying AI:", e);
    }
  }

  // ---------------------------------------------------------
  // STRATEGY 2: AI Parsing (Gemini)
  // ---------------------------------------------------------
  const ai = getAiInstance();
  if (!ai) throw new Error("مفتاح API مفقود. يرجى إضافته في الإعدادات لتفعيل الذكاء الاصطناعي.");

  let promptContent = '';
  let parts: any[] = [];

  // ... (Rest of existing AI logic)
  if (file.type.startsWith('image/')) {
    const base64Part = await fileToGenerativePart(file);
    parts = [base64Part];
    promptContent = `Analyze the attached image.`;
  } else if (file.type === 'application/pdf') {
    // ...
    const extractedText = await extractTextFromPDF(file);
    promptContent = `Analyze the following text extracted from a PDF document:\n${extractedText}`;
  } else if (isSpreadsheet) {
    // Re-read for AI prompt if local failed
    const extractedJson = await extractTextFromExcel(file);
    // TRUNCATE if too long to prevent token error
    const limitedJson = extractedJson.length > 30000 ? extractedJson.substring(0, 30000) + "...(truncated)" : extractedJson;
    promptContent = `Analyze the following data extracted from a spreadsheet (Excel/CSV):\n${limitedJson}`;
  } else {
    throw new Error("Unsupported file type");
  }

  // Specific instructions based on context
  let contextInstructions = '';

  if (context === 'students') {
    // ... (Keep existing prompt instructions)
    contextInstructions = `
      Extract a list of students.
      Output JSON Format:
      {
        "type": "students",
        "data": [
          {
            "fullName": "Student Name",
            "grade": "Grade Level",
            "roomNumber": "Room Number (if available)",
            "guardianPhone": "Phone Number",
            "gender": "male" or "female",
            "academicId": "Massar ID/CNE",
            "scholarshipType": "full",
            "guardianAddress": "Address",
            "guardianId": "Guardian CNIE/ID"
          }
        ]
      }
    `;
  } else if (context === 'health') {
    contextInstructions = `Extract health records. Return schema: { type: "health", data: [...] }`;
  } else if (context === 'attendance') {
    contextInstructions = `Extract attendance. Return schema: { type: "attendance", data: [...] }`;
  } else if (context === 'behavior') {
    contextInstructions = `
      Extract behavior records.
      Output JSON Format:
      {
        "type": "behavior",
        "data": [
          {
            "studentName": "Student Name",
            "type": "positive" or "negative",
            "category": "discipline" or "academic" or "psychological" or "social",
            "description": "Description of behavior",
            "date": "YYYY-MM-DD"
          }
        ]
      }
    `;
  } else if (context === 'academics') {
    contextInstructions = `Extract grades. Return schema: { type: "academics", data: [...] }`;
  }

  const systemInstructions = `
    You are an intelligent data extraction system.
    Extract structured data from the provided content matching the requested format.
    Return ONLY valid JSON.
    ${contextInstructions}
  `;

  const fullPrompt = `${systemInstructions}\n\n${promptContent}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: parts.length > 0
        ? { parts: [...parts, { text: systemInstructions }] }
        : fullPrompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw new Error("Failed to process document with AI");
  }
};
